import { View, Text, TextInput, Pressable, StyleSheet, ActivityIndicator, Keyboard, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, RotateCcw, Home, Download, Globe, ShieldCheck, X, Sparkles } from 'lucide-react-native';
import { useState, useRef, useEffect } from 'react';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

export default function BrowserScreen() {
  const [url, setUrl] = useState('https://www.google.com');
  const [inputUrl, setInputUrl] = useState('https://www.google.com');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const [detectedVideoUrl, setDetectedVideoUrl] = useState<string | null>(null);
  const fabAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const webViewRef = useRef<WebView>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (detectedVideoUrl) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [detectedVideoUrl]);

  const handleNavigate = () => {
    Keyboard.dismiss();
    let target = inputUrl.trim();
    if (!target.startsWith('http')) {
      target = 'https://www.google.com/search?q=' + encodeURIComponent(target);
    }
    setUrl(target);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleGoHome = () => {
    const homeUrl = 'https://www.google.com';
    setInputUrl(homeUrl);
    setUrl(homeUrl);
    // If the URL is already the home URL, React state won't trigger a reload,
    // so we manually tell the WebView to navigate or reload.
    webViewRef.current?.injectJavaScript(`window.location.href = "${homeUrl}";`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onNavigationStateChange = (navState: any) => {
    setInputUrl(navState.url);
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setIsLoading(navState.loading);

    const videoPatterns = [
      /youtube\.com\/watch\?v=/,
      /youtu\.be\//,
      /instagram\.com\/(p|reels|reel)\//,
      /vimeo\.com\/\d+/,
      /tiktok\.com\/.*\/video\//
    ];

    const isSpecificVideo = videoPatterns.some(pattern => pattern.test(navState.url));

    if (isSpecificVideo) {
      if (!detectedVideoUrl) {
        setDetectedVideoUrl(navState.url);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Animated.spring(fabAnim, { toValue: 1, useNativeDriver: true, tension: 50, friction: 7 }).start();
      } else if (detectedVideoUrl !== navState.url) {
        setDetectedVideoUrl(navState.url);
      }
    } else {
      if (detectedVideoUrl) {
        setDetectedVideoUrl(null);
        Animated.timing(fabAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start();
      }
    }
  };

  const handleDownloadPress = () => {
    if (!detectedVideoUrl) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: '/add-modal',
      params: { url: encodeURIComponent(detectedVideoUrl) }
    });
  };

  return (
    // KEY FIX: outer container uses flex column — header, webview, contextBar stack naturally.
    // No zIndex tricks needed; render order determines stacking for non-absolute elements.
    <View style={styles.container}>

      {/* Address Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.replace('/')}
            style={styles.headerBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <View pointerEvents="none" style={styles.iconWrapper}>
              <X size={20} color="#94a3b8" />
            </View>
          </Pressable>

          <View style={styles.addressBar}>
            <View style={styles.addressLeading}>
              <Globe size={14} color={isLoading ? "#0ea5e9" : "#475569"} />
            </View>
            <TextInput
              style={styles.urlInput}
              value={inputUrl}
              onChangeText={setInputUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              onSubmitEditing={handleNavigate}
              placeholder="Search or URL"
              placeholderTextColor="#475569"
              selectionColor="#0ea5e9"
            />
            {isLoading && (
              <ActivityIndicator size="small" color="#0ea5e9" style={styles.addressLoading} />
            )}
          </View>

          <Pressable
            onPress={() => webViewRef.current?.reload()}
            style={styles.headerBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <View pointerEvents="none" style={styles.iconWrapper}>
              <RotateCcw size={18} color="#ffffff" />
            </View>
          </Pressable>
        </View>

        {/* Dynamic Progress Bar */}
        <View style={styles.progressContainer}>
          {isLoading && (
            <View style={[styles.progressBar, { width: (progress * 100) + '%' }]} />
          )}
        </View>
      </View>

      {/* Browser Core — no zIndex, just flex: 1 to fill remaining space */}
      <View style={styles.webViewWrapper}>
        <WebView
          ref={webViewRef}
          source={{ uri: url }}
          onNavigationStateChange={onNavigationStateChange}
          onLoadProgress={({ nativeEvent }) => setProgress(nativeEvent.progress)}
          style={styles.webView}
          backgroundColor="#0f172a"
          allowsInlineMediaPlayback={true}
        />
      </View>

      {/* Navigation Control Bar — rendered AFTER webview in tree, naturally on top */}
      <View style={[styles.contextBar, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.controlsRow}>
          <View style={styles.navGroup}>
            <Pressable
              onPress={() => webViewRef.current?.goBack()}
              disabled={!canGoBack}
              style={[styles.navBtn, !canGoBack && styles.navBtnDisabled]}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 10 }}
            >
              <View pointerEvents="none" style={styles.iconWrapper}>
                <ChevronLeft size={28} color={canGoBack ? "#ffffff" : "#1e293b"} />
              </View>
            </Pressable>

            <View style={styles.navDivider} />

            <Pressable
              onPress={() => webViewRef.current?.goForward()}
              disabled={!canGoForward}
              style={[styles.navBtn, !canGoForward && styles.navBtnDisabled]}
              hitSlop={{ top: 20, bottom: 20, left: 10, right: 20 }}
            >
              <View pointerEvents="none" style={styles.iconWrapper}>
                <ChevronRight size={28} color={canGoForward ? "#ffffff" : "#1e293b"} />
              </View>
            </Pressable>
          </View>

          <View style={styles.centerStatus} pointerEvents="box-none">
            {detectedVideoUrl ? (
              <View style={styles.detectionBadge}>
                <Sparkles size={10} color="#0ea5e9" />
                <Text style={styles.detectionText}>VIDEO CAPTURABLE</Text>
              </View>
            ) : (
              <View style={styles.securityBadge}>
                <ShieldCheck size={10} color="#10b981" />
                <Text style={styles.securityText}>ENCRYPTED</Text>
              </View>
            )}
          </View>

          <Pressable
            onPress={handleGoHome}
            style={styles.homeBtn}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <View pointerEvents="none" style={styles.iconWrapper}>
              <Home size={22} color="#ffffff" />
            </View>
          </Pressable>
        </View>
      </View>

      {/* Smart Download FAB */}
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [
              { translateY: fabAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] }) },
              { scale: pulseAnim }
            ],
            opacity: fabAnim,
            bottom: insets.bottom + 90,
          }
        ]}
        pointerEvents={detectedVideoUrl ? 'auto' : 'none'}
      >
        <Pressable onPress={handleDownloadPress} style={styles.fab} hitSlop={10}>
          <View pointerEvents="none" style={styles.rowCenter}>
            <Download size={32} color="#ffffff" strokeWidth={2.5} />
          </View>
          {/* fabGlow must have pointerEvents none so it never blocks taps */}
          <View pointerEvents="none" style={styles.fabGlow} />
        </Pressable>
        {/*<Text style={styles.fabLabel}>DOWNLOAD</Text>*/}
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
    // No zIndex — header is first in tree, naturally above nothing
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  addressBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  addressLeading: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    height: '100%',
  },
  addressLoading: {
    marginLeft: 8,
  },
  progressContainer: {
    height: 2,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#0ea5e9',
  },
  webViewWrapper: {
    flex: 1,
    backgroundColor: '#0f172a',
    // REMOVED zIndex: 1 — this was the root cause blocking contextBar touches
  },
  webView: {
    flex: 1,
  },
  contextBar: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    paddingHorizontal: 20,
    paddingTop: 16,
    // No zIndex needed — rendered after webViewWrapper in tree = naturally on top
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 14,
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  navBtn: {
    width: 52,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnDisabled: {
    opacity: 0.1,
  },
  navDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  centerStatus: {
    flex: 1,
    alignItems: 'center',
  },
  detectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.15)',
  },
  detectionText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#0ea5e9',
    letterSpacing: 1,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    opacity: 0.4,
  },
  securityText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 1.5,
  },
  homeBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    // REMOVED zIndex: 10 — unnecessary and was part of the confusion
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    alignItems: 'center',
    zIndex: 100, // fine here since it's absolute-positioned
  },
  fab: {
    width: 62,
    height: 62,
    borderRadius: 36,
    backgroundColor: '#0ea5e9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 15,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  fabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(14, 165, 233, 0.03)',
    // REMOVED zIndex: -1 — unreliable in RN, replaced with pointerEvents="none" in JSX
  },
  fabLabel: {
    color: '#0ea5e9',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 12,
    letterSpacing: 2.5,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  }
});
