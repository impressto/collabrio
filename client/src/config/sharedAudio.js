// Centralized configuration for shared audio clips
// This file manages all shared audio files used across the application

export const sharedAudioClips = [
  {
    key: 'angry-indian-scam',
    filename: 'audio/angry-indian-scam.mp3',
    emoji: '😡',
    label: 'Angry Scam',
    displayName: 'Angry Scam'
  },
  {
    key: 'aw-piss',
    filename: 'audio/aw-piss.mp3',
    emoji: '🤬',
    label: 'Aw Piss',
    displayName: 'Aw Piss'
  },
  {
    key: 'babycry',
    filename: 'audio/babycry.mp3',
    emoji: '👶',
    label: 'Baby Cry',
    displayName: 'Baby Cry'
  },
  {
    key: 'bruh',
    filename: 'audio/bruh.mp3',
    emoji: '🙄',
    label: 'Bruh',
    displayName: 'Bruh'
  },
  {
    key: 'burp',
    filename: 'audio/burp.mp3', 
    emoji: '🤢',
    label: 'Burp',
    displayName: 'Burp'
  },
  {
    key: 'confetti-pop-sound',
    filename: 'audio/confetti-pop-sound.mp3',
    emoji: '🎉',
    label: 'Confetti Pop',
    displayName: 'Confetti Pop'
  },
  {
    key: 'deep-boom',
    filename: 'audio/deep-boom.mp3',
    emoji: '💥',
    label: 'Deep Boom',
    displayName: 'Deep Boom'
  },
  {
    key: 'ewww-you-nasty',
    filename: 'audio/ewww-you-nasty.mp3',
    emoji: '🤮',
    label: 'Eww Nasty',
    displayName: 'Eww You Nasty'
  },
  {
    key: 'exlposion',
    filename: 'audio/exlposion.mp3',
    emoji: '💣',
    label: 'Explosion',
    displayName: 'Explosion'
  },
  {
    key: 'fart-with-reverb',
    filename: 'audio/fart-with-reverb.mp3',
    emoji: '💨',
    label: 'Fart (Reverb)',
    displayName: 'Fart (Reverb)'
  },
  {
    key: 'get-yo-fat-ass-back-here',
    filename: 'audio/get-yo-fat-ass-back-here.mp3',
    emoji: '🗣️',
    label: 'Get Back Here',
    displayName: 'Get Back Here'
  },
  {
    key: 'go-play-minecraft',
    filename: 'audio/go-play-minecraft.mp3',
    emoji: '🎮',
    label: 'Go Play Minecraft',
    displayName: 'Go Play Minecraft'
  },
  {
    key: 'hmm',
    filename: 'audio/hmm.mp3',
    emoji: '🤔',
    label: 'Hmm',
    displayName: 'Hmm'
  },
  {
    key: 'huh',
    filename: 'audio/huh.mp3',
    emoji: '🤷',
    label: 'Huh',
    displayName: 'Huh'
  },
  {
    key: 'laught-muehehehe',
    filename: 'audio/laught-muehehehe.mp3',
    emoji: '😈',
    label: 'Evil Laugh',
    displayName: 'Evil Laugh'
  },
  {
    key: 'lego-sound',
    filename: 'audio/lego-sound.mp3',
    emoji: '🧱',
    label: 'Lego Sound',
    displayName: 'Lego Sound'
  },
  {
    key: 'man-gasping',
    filename: 'audio/man-gasping.mp3',
    emoji: '😱',
    label: 'Gasp',
    displayName: 'Man Gasping'
  },
  {
    key: 'metal-pipe-fall-meme',
    filename: 'audio/metal-pipe-fall-meme.mp3',
    emoji: '🔧',
    label: 'Metal Pipe Fall',
    displayName: 'Metal Pipe Fall'
  },
  {
    key: 'nope',
    filename: 'audio/nope.mp3',
    emoji: '🙅',
    label: 'Nope',
    displayName: 'Nope'
  },
  {
    key: 'oh-no-cringe',
    filename: 'audio/oh-no-cringe.mp3',
    emoji: '😬',
    label: 'Oh No Cringe',
    displayName: 'Oh No Cringe'
  },
  {
    key: 'rage_quit',
    filename: 'audio/rage_quit.mp3',
    emoji: '😤',
    label: 'Rage Quit',
    displayName: 'Rage Quit'
  },
  {
    key: 'sad',
    filename: 'audio/sad.mp3',
    emoji: '😢',
    label: 'Sad',
    displayName: 'Sad'
  },
  {
    key: 'scream',
    filename: 'audio/scream.mp3',
    emoji: '😱',
    label: 'Scream',
    displayName: 'Scream'
  },
  {
    key: 'sudden-suspense',
    filename: 'audio/sudden-suspense.mp3',
    emoji: '😰',
    label: 'Suspense',
    displayName: 'Sudden Suspense'
  },
  {
    key: 'thank-you-for-your-patronage',
    filename: 'audio/thank-you-for-your-patronage.mp3',
    emoji: '🙏',
    label: 'Thank You',
    displayName: 'Thank You'
  },
  {
    key: 'think-fast',
    filename: 'audio/think-fast.mp3',
    emoji: '💭',
    label: 'Think Fast',
    displayName: 'Think Fast'
  },
  {
    key: 'tuco-get-out',
    filename: 'audio/tuco-get-out.mp3',
    emoji: '🚪',
    label: 'Get Out',
    displayName: 'Tuco Get Out'
  },
  {
    key: 'wow',
    filename: 'audio/wow.mp3',
    emoji: '😲',
    label: 'Wow',
    displayName: 'Wow'
  },
  {
    key: 'yessir',
    filename: 'audio/yessir.mp3',
    emoji: '👍',
    label: 'Yes Sir',
    displayName: 'Yes Sir'
  },
  {
    key: 'yipeeee',
    filename: 'audio/yipeeee.mp3',
    emoji: '🎉',
    label: 'Yippee',
    displayName: 'Yippee'
  }
]

// Helper functions for easy access to specific data
export const getAudioEmojis = () => {
  return sharedAudioClips.reduce((acc, clip) => {
    acc[clip.key] = clip.emoji
    return acc
  }, {})
}

export const getAudioDisplayNames = () => {
  return sharedAudioClips.reduce((acc, clip) => {
    acc[clip.key] = clip.displayName
    return acc
  }, {})
}

export const getToolbarAudioOptions = () => {
  return [
    { value: '', label: '🔊 React' },
    ...sharedAudioClips.map(clip => ({
      value: clip.key,
      label: `${clip.emoji} ${clip.label}`
    }))
  ]
}

export const getAudioClipByKey = (key) => {
  return sharedAudioClips.find(clip => clip.key === key)
}

export default sharedAudioClips