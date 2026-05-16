import { useVideoPlayer, VideoView } from 'expo-video';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { X, Share2, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

export default function PlayerScreen() {
  const params = useLocalSearchParams<{ uri: string; title: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);

  // Decode params safely
  const videoUri = params.uri ? decodeURIComponent(params.uri) : '';
  const displayTitle = params.title ? decodeURIComponent(params.title) : 'Playing Media';

  const player = useVideoPlayer(videoUri, (p) => {
    p.loop = false;
    p.muted = false; // Ensure sound is ON by default
    p.volume = 1.0;  // Ensure volume is at max
    p.play();
  });

  // Listen for playback errors
  useEffect(() => {
    // Diagnostic check for file existence
    if (videoUri) {
      FileSystem.getInfoAsync(videoUri).then(info => {
        if (!info.exists) {
          console.error('[Player] File not found at:', videoUri);
          setError('The media file could not be located. It may have been deleted or moved.');
        }
      }).catch(err => {
        console.error('[Player] getInfoAsync error:', err);
        setError('An error occurred while trying to access the media file.');
      });
    }

    // Handle internal player errors
    const errorSub = player.addListener('error', (payload) => {
      console.error('[Player] VideoPlayer error:', payload);
      setError('The video player encountered a system error.');
    });

    return () => {
      errorSub.remove();
    };
  }, [player, videoUri]);

  const handleOpenExternally = async () => {
    try {
      await Sharing.shareAsync(videoUri);
    } catch (err) {
      Alert.alert('Error', 'Could not open the file externally.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText} numberOfLines={1}>{displayTitle}</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={handleOpenExternally}
              style={styles.headerBtn}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 10 }}
            >
              <View pointerEvents="none">
                <Share2 size={20} color="white" />
              </View>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={styles.headerBtn}
              hitSlop={{ top: 20, bottom: 20, left: 10, right: 20 }}
            >
              <View pointerEvents="none">
                <X size={26} color="white" />
              </View>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Main Video View or Error State */}
      <View style={styles.body}>
        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconBox}>
              <Info size={40} color="#ef4444" />
            </View>
            <Text style={styles.errorTitle}>Playback Error</Text>
            <Text style={styles.errorDesc}>{error}</Text>
            <Pressable onPress={handleOpenExternally} style={styles.fallbackBtn}>
              <Text style={styles.fallbackBtnText}>Open in VLC / Files</Text>
            </Pressable>
          </View>
        ) : (
          <VideoView
            style={styles.video}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
            nativeControls={true}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    position: 'relative',
    zIndex: 99,
    backgroundColor: '#000000',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  errorContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorIconBox: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  errorDesc: {
    color: '#94a3b8',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 22,
    marginBottom: 32,
  },
  fallbackBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 20,
  },
  fallbackBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
