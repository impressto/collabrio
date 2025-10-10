// Random Icebreaker Topics for Meeting Ice Breakers
// Diverse, safe, and meeting-appropriate topics

export const ICEBREAKER_TOPICS = [
  // Tech & Gaming
  'minecraft',
  'roblox',
  'fortnite',
  'mobile games',
  'game mods',
  'ai chatbots',
  'game glitches',
  'favorite streamers',
  'building vs surviving (in games)',

  // Online Life
  'tiktok trends',
  'viral memes',
  'youtube shorts vs tiktok',
  'social media drama (safe topics)',
  'favorite creators',
  'how long could you survive without your phone',
  'group chats and inside jokes',
  'internet slang and emoji meanings',

  // Creativity & Fandoms
  'fan art',
  'fan fiction',
  'favorite characters',
  'cosplay',
  'designing avatars',
  'making memes or edits',
  'ai art or voice cloning',
  'favorite fictional worlds',
  'if you could be in any game or show',

  // Food & Weird Stuff
  'weird food combos that actually slap',
  'snack hacks',
  'favorite fast food chains',
  'would you rather never eat pizza or never have wifi',
  'spicy food challenges',
  'boba vs soda debates',
  'midnight snacks',
  'favorite candy',

  // Entertainment
  'favorite youtube channels',
  'binge-worthy shows or anime',
  'music you can’t stop replaying',
  'artists blowing up right now',
  'concerts or virtual events',
  'voice actors you recognize everywhere',
  'reaction videos',
  'guess the song challenges',

  // Everyday Life
  'school hacks and funny teacher moments',
  'most embarrassing thing in class',
  'if i ruled my school',
  'friendship drama (fun and light)',
  'dream jobs or inventions',
  'favorite apps or websites',
  'life without homework',
  'one thing adults don’t get about teens',

  // Random & Fun
  'would you rather questions',
  'fun conspiracy theories',
  'internet mysteries',
  'mandela effect',
  '3am thoughts',
  'if pets could text',
  'ai takes over the world—what’s your role',
  'unpopular opinions'
];

/**
 * Get a random topic from the icebreaker topics array
 * @returns {string} A random topic for icebreaker generation
 */
export function getRandomTopic() {
  return ICEBREAKER_TOPICS[Math.floor(Math.random() * ICEBREAKER_TOPICS.length)];
}

/**
 * Create the AI prompt for icebreaker generation
 * @param {string} topic - The topic to generate an icebreaker about
 * @returns {string} The formatted prompt for the AI
 */
export function createIcebreakerPrompt(topic) {
  return `Generate a short, random, and humorous statement related to ${topic} that can be used to break the ice in a quiet meeting.`;
}