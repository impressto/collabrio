class GameManager {
  constructor() {
    this.activeGames = {}; // Store active game sessions
    this.gameTimers = {}; // Store active game timers
    this.assignmentTimers = {}; // Store assignment timeout timers
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
    
    // Clear any existing timer for this session
    if (this.gameTimers[sessionId]) {
      console.log(`[${new Date().toISOString()}] Clearing existing timer for session ${sessionId}`);
      clearInterval(this.gameTimers[sessionId]);
      delete this.gameTimers[sessionId];
    }
    
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
    console.log(`[${new Date().toISOString()}] Starting game timer for session ${sessionId} with ${timeLeft} seconds`);
    
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
        console.log(`[${new Date().toISOString()}] Game timer expired for session ${sessionId}`);
        clearInterval(gameTimer);
        delete this.gameTimers[sessionId];
        
        if (this.activeGames[sessionId]) {
          const gameState = this.activeGames[sessionId];
          const winners = gameState.winners || [];
          
          // Send game ended event with assignment option for original drawer
          io.to(sessionId).emit('game-ended', { 
            reason: 'timeout', 
            word: gameState.word,
            winners: winners.length > 0 ? winners : null,
            canAssignNext: true, // Allow assignment of next game master
            originalDrawer: gameState.drawer
          });
          
          // Start assignment timeout (30 seconds)
          this.startAssignmentTimeout(sessionId, io);
        }
      }
    }, 1000);
    
    // Store timer reference for cleanup
    this.gameTimers[sessionId] = gameTimer;
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

    // Clear any existing timer
    if (this.gameTimers[sessionId]) {
      console.log(`[${new Date().toISOString()}] Clearing timer for manually ended game in session ${sessionId}`);
      clearInterval(this.gameTimers[sessionId]);
      delete this.gameTimers[sessionId];
    }

    const gameState = this.activeGames[sessionId];
    const winners = gameState.winners || [];
    
    // Clean up game state
    delete this.activeGames[sessionId];

    // End the game with assignment option
    io.to(sessionId).emit('game-ended', { 
      reason: 'manual', 
      word: gameState.word,
      winners: winners.length > 0 ? winners : null,
      canAssignNext: true, // Allow assignment of next game master
      originalDrawer: gameState.drawer
    });

    // Start assignment timeout (30 seconds)
    this.startAssignmentTimeout(sessionId, io);
    
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
        
        // Clear any existing timer
        if (this.gameTimers[sessionId]) {
          clearInterval(this.gameTimers[sessionId]);
          delete this.gameTimers[sessionId];
        }
        
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
      
      // Clear any existing timer
      if (this.gameTimers[sessionId]) {
        clearInterval(this.gameTimers[sessionId]);
        delete this.gameTimers[sessionId];
      }
      
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
      
      if (gameState.type === 'drawing') {
        // Send current drawing game state
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
      } else if (gameState.type === 'frogger') {
        // Send current Frogger game state - leaderboard based
        console.log(`🐸 [FROGGER] Sending current Frogger state to new user: ${gameState.leaderboard?.length || 0} scores`);
        socket.emit('frogger-leaderboard-update', {
          leaderboard: gameState.leaderboard || []
        });
      }
    }
  }

  // Start assignment timeout
  startAssignmentTimeout(sessionId, io) {
    const timeoutDuration = 30000; // 30 seconds
    
    console.log(`[${new Date().toISOString()}] Starting assignment timeout for session ${sessionId} (${timeoutDuration/1000}s)`);
    
    const timeoutId = setTimeout(() => {
      console.log(`[${new Date().toISOString()}] Assignment timeout expired for session ${sessionId}`);
      
      // Clean up game state
      if (this.activeGames[sessionId]) {
        delete this.activeGames[sessionId];
      }
      
      // Clean up timeout reference
      delete this.assignmentTimers[sessionId];
      
      // Re-enable game button for all users
      io.to(sessionId).emit('game-status-change', { gameActive: false });
      
      // Notify that assignment expired
      io.to(sessionId).emit('assignment-expired');
    }, timeoutDuration);
    
    this.assignmentTimers[sessionId] = timeoutId;
  }

  // Assign next game master
  assignGameMaster(sessionId, assigner, newGameMaster, io) {
    console.log(`[${new Date().toISOString()}] Game master assignment: ${assigner} assigning to ${newGameMaster} in session ${sessionId}`);
    
    if (!sessionId || !assigner || !newGameMaster) {
      console.warn('Invalid assign-game-master request: missing required fields');
      return false;
    }

    // Check if there's a completed game waiting for assignment
    if (this.activeGames[sessionId]) {
      const gameState = this.activeGames[sessionId];
      
      // Only the original drawer can assign the next game master
      if (gameState.drawer !== assigner) {
        console.warn(`User ${assigner} is not authorized to assign game master in session ${sessionId}`);
        return false;
      }

      // Clear assignment timeout
      if (this.assignmentTimers[sessionId]) {
        clearTimeout(this.assignmentTimers[sessionId]);
        delete this.assignmentTimers[sessionId];
      }

      // Clean up the completed game state
      delete this.activeGames[sessionId];

      // Notify all users about the new game master assignment
      io.to(sessionId).emit('game-master-assigned', {
        newGameMaster: newGameMaster,
        assignedBy: assigner
      });

      // Re-enable game button for all users
      io.to(sessionId).emit('game-status-change', { gameActive: false });

      console.log(`[${new Date().toISOString()}] Game master assigned to ${newGameMaster} by ${assigner} in session ${sessionId}`);
      return true;
    } else {
      console.warn(`No completed game found for assignment in session ${sessionId}`);
      return false;
    }
  }

  // Skip assignment and end game normally
  skipAssignment(sessionId, user, io) {
    console.log(`[${new Date().toISOString()}] Skipping game master assignment in session ${sessionId} by ${user}`);
    
    if (!this.activeGames[sessionId]) {
      console.warn(`No completed game found to skip assignment in session ${sessionId}`);
      return false;
    }

    const gameState = this.activeGames[sessionId];
    
    // Only the original drawer can skip assignment
    if (gameState.drawer !== user) {
      console.warn(`User ${user} is not authorized to skip assignment in session ${sessionId}`);
      return false;
    }

    // Clear assignment timeout
    if (this.assignmentTimers[sessionId]) {
      clearTimeout(this.assignmentTimers[sessionId]);
      delete this.assignmentTimers[sessionId];
    }

    // Clean up the completed game state
    delete this.activeGames[sessionId];

    // Re-enable game button for all users
    io.to(sessionId).emit('game-status-change', { gameActive: false });

    // Notify that assignment was skipped
    io.to(sessionId).emit('assignment-skipped', {
      skippedBy: user
    });

    console.log(`[${new Date().toISOString()}] Game master assignment skipped by ${user} in session ${sessionId}`);
    return true;
  }

  // Start Frogger game
  startFroggerGame(sessionId, starter, io) {
    try {
      console.log(`🐸 [FROGGER] Starting game in session ${sessionId} by ${starter}`);
      
      // Check if there's already an active game
      if (this.activeGames[sessionId]) {
        console.warn(`🐸 [FROGGER] Game already active in session ${sessionId}`);
        return false;
      }

      // Create Frogger game state - score-based leaderboard system
      const gameState = {
        type: 'frogger',
        starter,
        startTime: Date.now(),
        timeLeft: 120, // 2 minutes
        gameEnded: false,
        leaderboard: [] // Array of {player, score, timeLeft, endReason, timestamp}
      };

      this.activeGames[sessionId] = gameState;

      // Emit to all clients in the session
      io.to(sessionId).emit('frogger-game-started', {
        starter,
        gameType: 'frogger'
      });

      // Set up timer for Frogger game (2 minutes)
      this.gameTimers[sessionId] = setInterval(() => {
        if (this.activeGames[sessionId] && this.activeGames[sessionId].type === 'frogger') {
          this.activeGames[sessionId].timeLeft -= 1;
          
          // Emit time update
          io.to(sessionId).emit('frogger-timer-update', {
            timeLeft: this.activeGames[sessionId].timeLeft
          });

          // End game when time runs out
          if (this.activeGames[sessionId].timeLeft <= 0) {
            this.endFroggerGame(sessionId, io);
          }
        }
      }, 1000);

      return true;
    } catch (error) {
      console.error('🐸 [FROGGER] Error starting game:', error);
      return false;
    }
  }

  // Handle Frogger score submission
  handleFroggerScoreSubmit(sessionId, playerName, finalScore, timeLeft, endReason, io) {
    try {
      const game = this.activeGames[sessionId];
      if (!game || game.type !== 'frogger' || game.gameEnded) {
        console.log(`🐸 [FROGGER] Cannot submit score - game not active in session ${sessionId}`);
        return false;
      }

      // Add score to leaderboard
      const scoreEntry = {
        player: playerName,
        score: finalScore,
        timeLeft: timeLeft || 0,
        endReason: endReason || 'unknown',
        timestamp: Date.now()
      };

      // Remove any existing score for this player and add the new one
      game.leaderboard = game.leaderboard.filter(entry => entry.player !== playerName);
      game.leaderboard.push(scoreEntry);
      
      // Sort leaderboard by score (descending)
      game.leaderboard.sort((a, b) => b.score - a.score);

      console.log(`🐸 [FROGGER] Score submitted: ${playerName} = ${finalScore} (${endReason})`);

      // Broadcast updated leaderboard to all players in session
      this.sendFroggerLeaderboard(sessionId, io);

      return true;
    } catch (error) {
      console.error('🐸 [FROGGER] Error handling score submission:', error);
      return false;
    }
  }

  // Send current leaderboard to session
  sendFroggerLeaderboard(sessionId, io) {
    try {
      const game = this.activeGames[sessionId];
      if (!game || game.type !== 'frogger') {
        return false;
      }

      io.to(sessionId).emit('frogger-leaderboard-update', {
        leaderboard: game.leaderboard
      });

      return true;
    } catch (error) {
      console.error('🐸 [FROGGER] Error sending leaderboard:', error);
      return false;
    }
  }

  // End Frogger game
  endFroggerGame(sessionId, io) {
    try {
      const game = this.activeGames[sessionId];
      if (!game || game.type !== 'frogger') {
        return false;
      }

      console.log(`🐸 [FROGGER] Ending game in session ${sessionId}`);

      // Use existing leaderboard as final results
      const leaderboard = game.leaderboard;

      // Determine winners (top scorers)
      const topScore = leaderboard[0]?.score || 0;
      const winners = leaderboard.filter(entry => entry.score === topScore).map(entry => entry.player);

      // Mark game as ended
      game.gameEnded = true;
      game.leaderboard = leaderboard;
      game.winners = winners;

      // Clear the timer
      if (this.gameTimers[sessionId]) {
        clearInterval(this.gameTimers[sessionId]);
        delete this.gameTimers[sessionId];
      }

      // Emit game end event
      io.to(sessionId).emit('frogger-session-end', {
        leaderboard,
        winners
      });

      io.to(sessionId).emit('game-status-change', {
        gameActive: false
      });

      // Clean up the game after a delay
      setTimeout(() => {
        if (this.activeGames[sessionId] && this.activeGames[sessionId].type === 'frogger') {
          delete this.activeGames[sessionId];
        }
      }, 30000); // 30 seconds

      return true;
    } catch (error) {
      console.error('🐸 [FROGGER] Error ending game:', error);
      return false;
    }
  }

  // Check if Frogger game should end when a user closes their modal
  shouldEndFroggerGameOnClose(sessionId, user, io) {
    try {
      const game = this.activeGames[sessionId];
      if (!game || game.type !== 'frogger' || game.gameEnded) {
        return false;
      }

      // If the user who closed the modal was the starter, end the game
      // This handles the case where the starter opens Frogger alone and then closes it
      if (game.starter === user) {
        console.log(`🐸 [FROGGER] Game starter ${user} closed modal - ending game in session ${sessionId}`);
        return true;
      }

      // If there are no scores submitted yet (no one has played), and someone closes, end the game
      if (!game.leaderboard || game.leaderboard.length === 0) {
        console.log(`🐸 [FROGGER] No scores submitted yet and ${user} closed modal - ending game in session ${sessionId}`);
        return true;
      }

      // Otherwise, keep the game running for other players
      return false;
    } catch (error) {
      console.error('🐸 [FROGGER] Error checking if game should end:', error);
      return false;
    }
  }

  // Check if Frogger game is active
  isFroggerGameActive(sessionId) {
    const game = this.activeGames[sessionId];
    return game && game.type === 'frogger' && !game.gameEnded;
  }

  // Get Frogger game state
  getFroggerGameState(sessionId) {
    const game = this.activeGames[sessionId];
    if (game && game.type === 'frogger') {
      return {
        type: 'frogger',
        starter: game.starter,
        timeLeft: game.timeLeft,
        gameEnded: game.gameEnded,
        leaderboard: game.leaderboard || []
      };
    }
    return null;
  }

  // Clean up all timers (useful for server shutdown)
  cleanup() {
    console.log(`[${new Date().toISOString()}] Cleaning up all game timers and assignment timers`);
    
    // Clear game timers
    Object.keys(this.gameTimers).forEach(sessionId => {
      clearInterval(this.gameTimers[sessionId]);
    });
    
    // Clear assignment timers
    Object.keys(this.assignmentTimers).forEach(sessionId => {
      clearTimeout(this.assignmentTimers[sessionId]);
    });
    
    this.gameTimers = {};
    this.assignmentTimers = {};
    this.activeGames = {};
  }
}

module.exports = GameManager;