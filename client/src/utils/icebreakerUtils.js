// Random Icebreaker Topics for Meeting Ice Breakers
// Diverse, safe, and meeting-appropriate topics

export const ICEBREAKER_TOPICS = [
  // Tech & Gaming (Updated for 2025)
  'minecraft but make it weird',
  'roblox currency as real money',
  'AI girlfriends/boyfriends',
  'discord servers you\'d never admit to joining',
  'mobile games that consumed your soul',
  'twitch streamers who lowkey changed your life',
  'game rage moments that weren\'t worth it',
  'building the most chaotic minecraft world',
  'if NPCs could rate your gameplay',

  // Social Media & Internet Culture
  'tiktok algorithms reading your mind',
  'memes that hit too close to home',
  'youtube rabbit holes at 3am',
  'group chat screenshots that would end friendships',
  'creators who fell off (respectfully)',
  'digital detox attempts that failed miserably',
  'internet drama you followed like a TV show',
  'emoji combinations that say everything',
  'making content vs consuming content',
  'parasocial relationships with fictional characters',
  'AI art that\'s better than human art',
  'virtual worlds you\'d actually live in',
  'if your search history became public',


  // Canadian GenZ Culture
  'Tim Hortons orders that define personality',
  'surviving Canadian winters without losing it',
  'maple syrup on things it shouldn\'t be on',
  'hockey vs literally any other sport debates',
  'explaining Canada to Americans',
  'cottage country vs city life',
  'Canadian slang that confuses everyone else',
  'complaining about Canadian Netflix selection',
  'double-double psychology',
  'Canadian politeness as a survival mechanism',

  // Food & Lifestyle
  'food combos that sound illegal but taste fire',
  'late-night convenience store runs',
  'fast food hacks that employees hate',
  'energy drinks vs actual sleep',
  'meal prep attempts vs reality',
  'foods that taste like childhood',
  'cooking disasters that were somehow edible',
  'guilty pleasure snacks',

  
  // Media & Entertainment
  'shows you binged instead of sleeping',
  'music that hits different at 2am',
  'artists before they were mainstream',
  'concerts that changed your brain chemistry',
  'voice actors who voice your inner monologue',
  'reaction videos that are better than the original',
  'soundtracks that live in your head rent-free',
  'podcasts that made you question everything',

  // School & Social Life
  'teacher moments that became legendary',
  'group project trauma stories',
  'if you could redesign high school',
  'friendship dynamics that make no sense',
  'future careers that don\'t exist yet',
  'apps that secretly run your life',
  'homework vs literally anything else',
  'things boomers will never understand about us',

  // Existential & Random
  'shower thoughts that keep you up',
  'conspiracy theories you lowkey believe',
  'internet mysteries you need solved',
  'mandela effects that broke your brain',
  '3am thoughts that hit different',
  'if pets had social media accounts',
  'AI uprising scenarios (realistic edition)',
  'unpopular opinions you\'ll defend forever',
  'alternate timeline versions of yourself',
  'simulation theory evidence in daily life'
];

// Keep track of recently used topics to avoid immediate repetition
let recentTopics = [];
const MAX_RECENT_TOPICS = Math.min(10, Math.floor(ICEBREAKER_TOPICS.length * 0.3)); // Track up to 30% of topics or 10, whichever is smaller

/**
 * Get a random topic from the icebreaker topics array, avoiding recent repeats
 * @returns {string} A random topic for icebreaker generation
 */
export function getRandomTopic() {
  console.log(`🎯 Getting random topic. Recent topics count: ${recentTopics.length}/${MAX_RECENT_TOPICS}`);
  
  // If we haven't used many topics yet, or if we've used most topics, reset the recent list
  if (recentTopics.length >= MAX_RECENT_TOPICS || recentTopics.length >= ICEBREAKER_TOPICS.length - 1) {
    console.log(`🔄 Resetting recent topics (had ${recentTopics.length} topics)`);
    recentTopics = [];
  }

  // Get available topics (excluding recent ones)
  const availableTopics = ICEBREAKER_TOPICS.filter(topic => !recentTopics.includes(topic));
  
  // Fallback: if no available topics (shouldn't happen with the reset above), use all topics
  const topicsToChooseFrom = availableTopics.length > 0 ? availableTopics : ICEBREAKER_TOPICS;
  
  console.log(`📋 Available topics: ${availableTopics.length}, Total topics: ${ICEBREAKER_TOPICS.length}`);
  
  // Select random topic with better entropy
  // Use crypto.getRandomValues if available, fallback to Math.random
  let randomValue;
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    randomValue = array[0] / (0xffffffff + 1);
  } else {
    // Add extra entropy by combining multiple random sources
    randomValue = (Math.random() + Date.now() * Math.random()) % 1;
  }
  
  const randomIndex = Math.floor(randomValue * topicsToChooseFrom.length);
  const selectedTopic = topicsToChooseFrom[randomIndex];
  
  console.log(`✅ Selected topic: "${selectedTopic}" (index ${randomIndex}/${topicsToChooseFrom.length})`);
  
  // Add to recent topics
  recentTopics.push(selectedTopic);
  
  // Optional: Add some extra randomness by shuffling the recent array occasionally
  if (Math.random() < 0.1) { // 10% chance to shuffle recent topics
    recentTopics = recentTopics.sort(() => Math.random() - 0.5);
    console.log(`🎲 Shuffled recent topics array`);
  }
  
  return selectedTopic;
}

/**
 * Reset the recent topics cache to allow all topics to be used again
 */
export function resetRecentTopics() {
  recentTopics = [];
}

/**
 * Get multiple unique random topics
 * @param {number} count - Number of unique topics to get
 * @returns {string[]} Array of unique random topics
 */
export function getMultipleRandomTopics(count = 5) {
  const topics = [];
  const tempRecentTopics = [...recentTopics]; // Store original state
  
  for (let i = 0; i < Math.min(count, ICEBREAKER_TOPICS.length); i++) {
    topics.push(getRandomTopic());
  }
  
  // Don't permanently affect the recent topics for this bulk operation
  // Comment out the next line if you want bulk operations to affect the main recent topics list
  // recentTopics = tempRecentTopics;
  
  return topics;
}

/**
 * Get debug info about topic usage
 * @returns {object} Debug information about recent topics and availability
 */
export function getTopicDebugInfo() {
  return {
    totalTopics: ICEBREAKER_TOPICS.length,
    recentTopicsCount: recentTopics.length,
    recentTopics: [...recentTopics],
    availableTopics: ICEBREAKER_TOPICS.filter(topic => !recentTopics.includes(topic)).length,
    maxRecentTopics: MAX_RECENT_TOPICS
  };
}

/**
 * Test function to verify randomization is working properly
 * @param {number} iterations - Number of topics to generate for testing
 * @returns {object} Test results showing topic distribution
 */
export function testRandomization(iterations = 20) {
  console.log(`🧪 Testing randomization with ${iterations} iterations...`);
  
  const originalRecentTopics = [...recentTopics];
  const results = [];
  const topicCounts = {};
  
  // Reset for clean test
  resetRecentTopics();
  
  for (let i = 0; i < iterations; i++) {
    const topic = getRandomTopic();
    results.push(topic);
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  }
  
  // Restore original state
  recentTopics = originalRecentTopics;
  
  const uniqueTopics = Object.keys(topicCounts).length;
  const repeatedTopics = Object.entries(topicCounts).filter(([_, count]) => count > 1);
  
  console.log(`📊 Test Results:
    - Total iterations: ${iterations}
    - Unique topics generated: ${uniqueTopics}
    - Repeated topics: ${repeatedTopics.length}
    - Repetition rate: ${(repeatedTopics.length / uniqueTopics * 100).toFixed(1)}%
  `);
  
  if (repeatedTopics.length > 0) {
    console.log('🔄 Repeated topics:', repeatedTopics);
  }
  
  return {
    totalIterations: iterations,
    uniqueTopics,
    repeatedTopics: repeatedTopics.length,
    repetitionRate: (repeatedTopics.length / uniqueTopics * 100).toFixed(1) + '%',
    topicCounts,
    results
  };
}

/**
 * Create the AI prompt for icebreaker generation
 * @param {string} topic - The topic to generate an icebreaker about
 * @returns {string} The formatted prompt for the AI
 */
export function createIcebreakerPrompt(topic) {
  return `Generate a short, weird, and quirky statement or fact related to ${topic}`;
}