// Icebreaker Topics for Meeting Ice Breakers
// Fascinating and quirky topics to spark interesting conversations

export const ICEBREAKER_TOPICS = [
  'Ridiculous laws around the world',
  'Bizarre ancient inventions',
  'Strange royal traditions',
  'Failed predictions about the future',
  'Weird space facts',
  'Accidental inventions',
  'Unusual weather phenomena',
  'Creepy deep-sea creatures',
  'Plants with strange abilities',
  'Movies that flopped but became cult classics',
  'Video games that were too bad to be true',
  'Bizarre world beliefs & superstitions',
  'Unbelievable coincidences',
  'Strange habits of geniuses',
  'Weirdest tourist attractions',
  'Strange jobs people actually get paid for',
  'The worst inventions ever made',
  'Strangest last words',
  'World\'s most unsuccessful crimes',
  'Disasters caused by typos or small mistakes'
]

// Keep track of recently used topics to avoid immediate repetition
let recentTopics = []
const MAX_RECENT_TOPICS = Math.min(10, Math.floor(ICEBREAKER_TOPICS.length * 0.3)) // Track up to 30% of topics or 10, whichever is smaller

/**
 * Get all available icebreaker topics for dropdown display
 * @returns {Array<string>} Array of all icebreaker topics
 */
export function getAllTopics() {
  return [...ICEBREAKER_TOPICS]
}

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
  return `Generate a short, factual statement or fact related to ${topic}`;
}