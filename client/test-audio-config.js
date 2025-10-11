// Test file to verify centralized audio configuration
import { 
  sharedAudioClips, 
  getAudioEmojis, 
  getAudioDisplayNames, 
  getToolbarAudioOptions,
  getAudioClipByKey 
} from '../src/config/sharedAudio.js'

console.log('=== Centralized Audio Configuration Test ===')

console.log('\n1. Total audio clips:', sharedAudioClips.length)

console.log('\n2. Sample clip structure:', sharedAudioClips[0])

console.log('\n3. Audio emojis:', getAudioEmojis())

console.log('\n4. Audio display names:', getAudioDisplayNames())

console.log('\n5. Toolbar options:', getToolbarAudioOptions())

console.log('\n6. Get specific clip (breaklaw):', getAudioClipByKey('breaklaw'))

console.log('\n7. All clips have required fields:', 
  sharedAudioClips.every(clip => 
    clip.key && clip.filename && clip.emoji && clip.label && clip.displayName
  )
)

console.log('\n=== Test Complete ===')