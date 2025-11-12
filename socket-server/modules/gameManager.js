class GameManager {
  constructor() {
    this.activeGames = {}; // Store active game sessions
  }

  // Get all available words
  getAllWords() {
    return process.env.DRAWING_WORDS ? 
      process.env.DRAWING_WORDS.split(',').map(word => word.trim()) : 
      [
        // Tech & Digital
        'Emoji', 'TikTok logo', 'Selfie', 'Robot', 'Alien', 'YouTube play button', 
        'Headphones', 'Controller', 'WiFi', 'QR code',
        // Food & Drinks
        'Pizza', 'Burger', 'Donut', 'Ice cream', 'French fries', 'Bubble tea', 
        'Coffee cup', 'Water bottle', 'Candy', 'Hotdog',
        // Fashion & Accessories
        'Hoodie', 'Sneakers', 'Sunglasses', 'Backpack', 'Skateboard', 'Watch', 
        'Beanie', 'Necklace', 'Cap', 'Nail polish',
        // Animals & Nature
        'Cat', 'Dog', 'Panda', 'Frog', 'Shark', 'Butterfly', 'Snake', 'Tree', 
        'Cloud', 'Sun',
        // Objects & Symbols
        'Heart', 'Rainbow', 'Star', 'Crown', 'Balloon', 'Camera', 'Guitar', 
        'Skate park', 'Fire', 'Diamond'
      ];
  }

  // Get random word from environment or default list (for backward compatibility)
  getRandomWord() {
    const words = this.getAllWords();
    return words[Math.floor(Math.random() * words.length)];
  }

  // Get random word choices for selection
  getWordChoices(count = 10) {
    const allWords = this.getAllWords();
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, allWords.length));
  }

  // Get game time limit from environment or default
  getGameTimeLimit() {
    return parseInt(process.env.GAME_TIME_LIMIT) || 60; // Default 60 seconds
  }

  // Request to start game - send word choices to drawer
  requestGameStart(sessionId, starter, socket) {
    console.log(`[${new Date().toISOString()}] Game start request by ${starter} in session ${sessionId}`);
    
    if (!sessionId || !starter) {
      console.warn('Invalid start-game request: missing required fields');
      return false;
    }

    // Get 10 random word choices
    const wordChoices = this.getWordChoices(10);
    
    // Send word choices to the drawer
    socket.emit('word-selection', {
      wordChoices: wordChoices
    });
    
    console.log(`[${new Date().toISOString()}] Sent word choices to ${starter} in session ${sessionId}:`, wordChoices);
    return true;
  }

  // Start a new game with selected word
  startGame(sessionId, starter, selectedWord, io) {
    console.log(`[${new Date().toISOString()}] Game start with selected word by ${starter} in session ${sessionId}: "${selectedWord}"`);
    
    if (!sessionId || !starter || !selectedWord) {
      console.warn('Invalid start-game request: missing required fields');
      return false;
    }

    // Validate that the selected word is from our word list
    const allWords = this.getAllWords();
    if (!allWords.includes(selectedWord)) {
      console.warn(`Invalid word selection: "${selectedWord}" not in word list`);
      return false;
    }

    const gameTimeLimit = this.getGameTimeLimit();
    
    // Store game state
    this.activeGames[sessionId] = {
      drawer: starter,
      word: selectedWord,
      timeLeft: gameTimeLimit,
      guesses: [],
      winners: [],
      startTime: Date.now()
    };
    
    // Start the game
    io.to(sessionId).emit('game-started', {
      drawer: starter,
      word: selectedWord,
      timeLeft: gameTimeLimit
    });
    
    // Broadcast game status to disable buttons for all users
    io.to(sessionId).emit('game-status-change', { gameActive: true });
    
    // Start game timer
    this.startGameTimer(sessionId, gameTimeLimit, io);
    
    console.log(`[${new Date().toISOString()}] Game started in session ${sessionId}: ${starter} drawing "${selectedWord}"`);
    return true;
  }

  // Start game timer
  startGameTimer(sessionId, timeLeft, io) {
    const gameTimer = setInterval(() => {
      timeLeft--;
      
      // Update stored game state
      if (this.activeGames[sessionId]) {
        this.activeGames[sessionId].timeLeft = timeLeft;
      }

      // Broadcast time update
      io.to(sessionId).emit('game-timer-update', { timeLeft });

      // End game when time runs out
      if (timeLeft <= 0) {
        clearInterval(gameTimer);
        
        if (this.activeGames[sessionId]) {
          const gameState = this.activeGames[sessionId];
          const winners = gameState.winners || [];
          
          io.to(sessionId).emit('game-ended', { 
            reason: 'timeout', 
            word: gameState.word,
            winners: winners.length > 0 ? winners : null
          });
          
          // Clean up game state
          delete this.activeGames[sessionId];
          
          // Re-enable game button for all users when game actually ends
          io.to(sessionId).emit('game-status-change', { gameActive: false });
        }
      }
    }, 1000);
  }

  // End a game manually
  endGame(sessionId, io) {
    console.log(`[${new Date().toISOString()}] Manual game end request for session ${sessionId}`);
    
    if (!sessionId) {
      console.warn('Invalid end-game request: missing sessionId');
      return false;
    }

    if (!this.activeGames[sessionId]) {
      console.warn(`No active game found for session ${sessionId}`);
      return false;
    }

    const gameState = this.activeGames[sessionId];
    const winners = gameState.winners || [];
    
    // Clean up game state
    delete this.activeGames[sessionId];

    // End the game
    io.to(sessionId).emit('game-ended', { 
      reason: 'manual', 
      word: gameState.word,
      winners: winners.length > 0 ? winners : null
    });

    // Re-enable game button for all users when game actually ends
    io.to(sessionId).emit('game-status-change', { gameActive: false });
    
    console.log(`[${new Date().toISOString()}] Game ended manually in session ${sessionId}`);
    return true;
  }

  // Process a game guess
  processGuess(sessionId, guesser, guess, io) {
    if (!this.activeGames[sessionId]) {
      return { success: false, reason: 'No active game' };
    }

    const gameState = this.activeGames[sessionId];
    
    // Don't allow the drawer to guess
    if (gameState.drawer === guesser) {
      return { success: false, reason: 'Drawer cannot guess' };
    }

    // Check if user already won
    if (gameState.winners && gameState.winners.includes(guesser)) {
      return { success: false, reason: 'Already won' };
    }

    const isCorrect = guess.toLowerCase().trim() === gameState.word.toLowerCase();
    
    // Add guess to game state
    gameState.guesses.push({
      user: guesser,
      guess: guess,
      isCorrect: isCorrect,
      timestamp: Date.now()
    });

    if (isCorrect) {
      // Add to winners list
      if (!gameState.winners) gameState.winners = [];
      gameState.winners.push(guesser);
      
      console.log(`[${new Date().toISOString()}] Correct guess by ${guesser} in session ${sessionId}: "${guess}"`);
      
      // Broadcast correct guess
      io.to(sessionId).emit('game-guess', {
        user: guesser,
        guess: guess,
        isCorrect: true,
        winner: guesser,
        winners: gameState.winners
      });

      return { success: true, correct: true, winner: guesser };
    } else {
      console.log(`[${new Date().toISOString()}] Incorrect guess by ${guesser} in session ${sessionId}: "${guess}"`);
      
      // Broadcast incorrect guess
      io.to(sessionId).emit('game-guess', {
        user: guesser,
        guess: guess,
        isCorrect: false
      });

      return { success: true, correct: false };
    }
  }

  // Handle user closing game modal
  handleModalClose(sessionId, user, io) {
    console.log(`[${new Date().toISOString()}] User ${user} closed game modal in session ${sessionId}`);
    
    if (!sessionId || !user) {
      console.warn('Invalid close-game-modal request: missing required fields');
      return false;
    }

    // Check if there's an active game and if this user is the drawer
    if (this.activeGames[sessionId]) {
      const gameState = this.activeGames[sessionId];
      
      // If the person closing the modal is the drawer (who initiated the game)
      if (gameState.drawer === user) {
        console.log(`[${new Date().toISOString()}] Drawer ${user} closed modal, re-enabling game button for all users in session ${sessionId}`);
        
        // Re-enable game button for all users since the drawer closed their modal
        io.to(sessionId).emit('game-status-change', { gameActive: false });
        
        // Clean up the game state since the drawer left
        delete this.activeGames[sessionId];
        return true;
      } else {
        console.log(`[${new Date().toISOString()}] Non-drawer ${user} closed modal, keeping game button disabled for all users in session ${sessionId}`);
        // Don't re-enable the button since a non-drawer closed their modal
        return false;
      }
    } else {
      console.log(`[${new Date().toISOString()}] No active game found for session ${sessionId} when ${user} closed modal`);
      return false;
    }
  }

  // Handle user disconnecting or leaving session
  handleUserLeave(sessionId, username, io) {
    if (!this.activeGames[sessionId]) {
      return false;
    }

    const gameState = this.activeGames[sessionId];
    
    if (gameState.drawer === username) {
      console.log(`[${new Date().toISOString()}] Drawer ${username} left session, re-enabling game button for all users in session ${sessionId}`);
      
      // Re-enable game button for all users since the drawer left
      io.to(sessionId).emit('game-status-change', { gameActive: false });
      
      // Clean up the game state since the drawer left
      delete this.activeGames[sessionId];
      return true;
    }
    
    return false;
  }

  // Get current game state for a session
  getCurrentGameState(sessionId) {
    return this.activeGames[sessionId] || null;
  }

  // Check if a session has an active game
  hasActiveGame(sessionId) {
    return !!this.activeGames[sessionId];
  }

  // Send current game state to a socket
  sendCurrentGameState(sessionId, socket, io) {
    const gameState = this.getCurrentGameState(sessionId);
    if (gameState) {
      console.log(`🎮 [GAME] Sending current game state to new user in session ${sessionId}`);
      
      // Send game status to disable button
      socket.emit('game-status-change', { gameActive: true });
      
      // Send current game state
      socket.emit('current-game-state', {
        drawer: gameState.drawer,
        word: gameState.word,
        timeLeft: gameState.timeLeft,
        guesses: gameState.guesses || []
      });

      // Send any previous guesses
      if (gameState.guesses && gameState.guesses.length > 0) {
        gameState.guesses.forEach(guess => {
          socket.emit('game-guess', guess);
        });
      }
    }
  }
}

module.exports = GameManager;