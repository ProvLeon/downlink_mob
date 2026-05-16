import { View, Text, TextInput, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Image, ActivityIndicator, LayoutAnimation } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { X, Check, Link2, Clipboard as ClipboardIcon, Video, Music, Plus, Download, PlayCircle } from 'lucide-react-native';
import { useState, useCallback, useEffect } from 'react';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { FORMAT_PRESETS } from '../src/types/index';
import { DownloadService, API_BASE } from '../src/services/downloadService';

export default function AddModal() {
  const params = useLocalSearchParams<{ url?: string }>();

  // Initialize with param if available (from Browser detection)
  const [url, setUrl] = useState(params.url ? decodeURIComponent(params.url) : '');
  const [selectedPreset, setSelectedPreset] = useState('mp4_720p');
  const [activeTab, setActiveTab] = useState<'video' | 'audio'>('video');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<{ title: string, author: string, duration: string, thumbnail: string } | null>(null);

  const videoPresets = Object.values(FORMAT_PRESETS).filter(p => p.videoQuality !== 'none');
  const audioPresets = Object.values(FORMAT_PRESETS).filter(p => p.videoQuality === 'none');

  useEffect(() => {
    let isActive = true;

    const fetchInfo = async (targetUrl: string) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsAnalyzing(true);
      setMediaInfo(null);

      try {
        const res = await fetch(`${API_BASE}/api/formats`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: targetUrl, preset: 'mp4_720p' }),
        });

        if (!res.ok) throw new Error('Failed to fetch format info');

        const data = await res.json();

        if (isActive) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

          let durationStr = data.duration || "0:00";
          if (typeof data.duration === 'number') {
            const m = Math.floor(data.duration / 60);
            const s = Math.floor(data.duration % 60);
            durationStr = `${m}:${s.toString().padStart(2, '0')}`;
          }

          setMediaInfo({
            title: data.title || "Unknown Title",
            author: data.uploader || "Unknown Author",
            duration: durationStr,
            thumbnail: data.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=1000&auto=format&fit=crop"
          });
          setIsAnalyzing(false);
        }
      } catch (err) {
        if (isActive) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setMediaInfo(null);
          setIsAnalyzing(false);
        }
      }
    };

    if (url.trim().length > 10 && (url.includes('http://') || url.includes('https://'))) {
      fetchInfo(url.trim());
    } else {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setMediaInfo(null);
      setIsAnalyzing(false);
    }

    return () => {
      isActive = false;
    };
  }, [url]);

  const handleAdd = useCallback(() => {
    if (!url.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    DownloadService.addDownload(url, selectedPreset);
    router.back();
  }, [url, selectedPreset]);

  const handlePaste = useCallback(async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrl(text);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, []);

  const selectPreset = useCallback((id: string) => {
    setSelectedPreset(id);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleTabChange = (tab: 'video' | 'audio') => {
    setActiveTab(tab);
    setSelectedPreset(tab === 'video' ? 'mp4_720p' : 'audio_mp3');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* ─── Header Area ─────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerGroup}>
          <View style={styles.headerIconWrapper}>
            <Plus size={22} color="#0ea5e9" strokeWidth={3} />
          </View>
          <View>
            <Text style={styles.headerTitle}>New Task</Text>
            <Text style={styles.headerTagline}>AUTHENTIC MEDIA CAPTURE</Text>
          </View>
        </View>
        <Pressable
          onPress={() => router.back()}
          style={styles.closeBtn}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
        >
          <View pointerEvents="none" style={styles.closeIconWrapper}>
            <X size={20} color="#94a3b8" />
          </View>
        </Pressable>
      </View>

      {/* ─── Main Scroll Surface ─────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* URL Entry Card */}
        <View style={styles.urlSection}>
          <View style={styles.inputLabelBar}>
            <Text style={styles.inputLabelText}>Media Source</Text>
            {url.length > 0 && (
              <Pressable onPress={() => setUrl('')} hitSlop={10}>
                <Text style={styles.clearActionText}>CLEAR</Text>
              </Pressable>
            )}
          </View>
          <View style={styles.inputContainer}>
            <Link2 size={18} color={url ? "#0ea5e9" : "#475569"} style={styles.inputLeadingIcon} />
            <TextInput
              style={styles.urlTextInput}
              placeholder="Paste media link here..."
              placeholderTextColor="#475569"
              value={url}
              onChangeText={setUrl}
              autoCapitalize="none"
              autoCorrect={false}
              selectionColor="#0ea5e9"
            />
            <Pressable style={styles.pasteActionBtn} onPress={handlePaste}>
              <ClipboardIcon size={13} color="white" />
              <Text style={styles.pasteActionText}>PASTE</Text>
            </Pressable>
          </View>
        </View>

        {isAnalyzing && (
          <View style={styles.loadingPulse}>
            <ActivityIndicator size="small" color="#0ea5e9" />
            <Text style={styles.loadingPulseText}>SECURELY ANALYZING STREAM...</Text>
          </View>
        )}

        {/* Media Hub Card */}
        {mediaInfo && (
          <View style={styles.hubCard}>
            <View style={styles.hubMetadata}>
              <View style={styles.thumbContainer}>
                <Image source={{ uri: mediaInfo.thumbnail }} style={styles.hubThumb} />
                <View style={styles.hubDuration}>
                  <Text style={styles.hubDurationText}>{mediaInfo.duration}</Text>
                </View>
              </View>
              <View style={styles.hubInfo}>
                <Text style={styles.hubTitle} numberOfLines={2}>{mediaInfo.title}</Text>
                <View style={styles.hubBadgeRow}>
                  <View style={styles.platformBadge}>
                    <PlayCircle size={10} color="#0ea5e9" strokeWidth={3} />
                    <Text style={styles.platformBadgeText}>YOUTUBE</Text>
                  </View>
                  <Text style={styles.hubAuthor} numberOfLines={1}>{mediaInfo.author}</Text>
                </View>
              </View>
            </View>

            {/* Integrated Configuration Zone */}
            <View style={styles.configHub}>
              <View style={styles.floatingTabs}>
                <Pressable
                  onPress={() => handleTabChange('video')}
                  style={[styles.floatingTab, activeTab === 'video' && styles.floatingTabActive]}
                >
                  <Video size={15} color={activeTab === 'video' ? '#ffffff' : '#475569'} strokeWidth={2.5} />
                  <Text style={[styles.floatingTabText, activeTab === 'video' && styles.floatingTabTextActive]}>VIDEO</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleTabChange('audio')}
                  style={[styles.floatingTab, activeTab === 'audio' && styles.floatingTabActive]}
                >
                  <Music size={15} color={activeTab === 'audio' ? '#ffffff' : '#475569'} strokeWidth={2.5} />
                  <Text style={[styles.floatingTabText, activeTab === 'audio' && styles.floatingTabTextActive]}>AUDIO</Text>
                </Pressable>
              </View>

              <View style={styles.hubSeparator} />

              <View style={styles.qualityContainer}>
                <Text style={styles.hubLabel}>SELECT QUALITY</Text>
                <View style={styles.qualityScrollerWrapper}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.qualityPills}
                    decelerationRate="fast"
                  >
                    {(activeTab === 'video' ? videoPresets : audioPresets).map((preset) => (
                      <Pressable
                        key={preset.id}
                        onPress={() => selectPreset(preset.id)}
                        style={[
                          styles.pillBtn,
                          selectedPreset === preset.id && styles.pillBtnActive
                        ]}
                      >
                        <Text style={[
                          styles.pillBtnText,
                          selectedPreset === preset.id && styles.pillBtnTextActive
                        ]}>
                          {preset.label.replace('MP4 ', '').replace('Audio ', '')}
                        </Text>
                        {selectedPreset === preset.id && <View style={styles.pillActiveDot} />}
                      </Pressable>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ─── Fixed Footer Area ───────────────────────────────────────────── */}
      <View style={styles.footer}>
        <Pressable
          style={[
            styles.downloadBtn,
            !url.trim() ? styles.downloadBtnOff : styles.downloadBtnOn
          ]}
          onPress={handleAdd}
          disabled={!url.trim()}
        >
          <Download size={22} color="white" strokeWidth={3} />
          <Text style={styles.downloadBtnText}>ACTIVATE DOWNLOAD</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate-950
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 24,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  headerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerIconWrapper: {
    width: 44,
    height: 44,
    backgroundColor: 'rgba(14, 165, 233, 0.06)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(14, 165, 233, 0.12)',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: -0.8,
  },
  headerTagline: {
    fontSize: 9,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 2,
    marginTop: -2,
  },
  closeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 10,
  },
  closeIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  urlSection: {
    marginBottom: 44,
  },
  inputLabelBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  inputLabelText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  clearActionText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f43f5e',
    letterSpacing: 0.5,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLeadingIcon: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
  },
  urlTextInput: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 22,
    paddingVertical: 18,
    paddingLeft: 52,
    paddingRight: 110,
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '500',
  },
  pasteActionBtn: {
    position: 'absolute',
    right: 8,
    top: 8,
    bottom: 8,
    paddingHorizontal: 20,
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  pasteActionText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
    marginLeft: 8,
    letterSpacing: 1,
  },
  loadingPulse: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingPulseText: {
    color: '#475569',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 20,
    letterSpacing: 3.5,
  },
  hubCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.4,
    shadowRadius: 40,
    elevation: 20,
    overflow: 'hidden',
  },
  hubMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
    padding: 22,
  },
  thumbContainer: {
    width: 100,
    height: 100,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  hubThumb: {
    width: '100%',
    height: '100%',
    opacity: 0.9,
  },
  hubDuration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hubDurationText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '900',
  },
  hubInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  hubTitle: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.8,
    lineHeight: 23,
    marginBottom: 12,
  },
  hubBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  platformBadge: {
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
  platformBadgeText: {
    color: '#0ea5e9',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  hubAuthor: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    flex: 1,
  },
  configHub: {
    backgroundColor: 'rgba(2, 6, 23, 0.8)',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
  },
  floatingTabs: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  floatingTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 13,
    gap: 8,
  },
  floatingTabActive: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  floatingTabText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#475569',
    letterSpacing: 1.5,
  },
  floatingTabTextActive: {
    color: '#ffffff',
  },
  hubSeparator: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    marginVertical: 24,
  },
  qualityContainer: {},
  hubLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: 3,
    marginBottom: 16,
    textAlign: 'center',
  },
  qualityScrollerWrapper: {
    marginHorizontal: -20,
  },
  qualityPills: {
    paddingHorizontal: 20,
    gap: 12,
  },
  pillBtn: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillBtnActive: {
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    borderColor: '#0ea5e9',
  },
  pillBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#334155',
    letterSpacing: -0.5,
  },
  pillBtnTextActive: {
    color: '#0ea5e9',
  },
  pillActiveDot: {
    position: 'absolute',
    bottom: 6,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#0ea5e9',
  },
  footer: {
    paddingHorizontal: 28,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.03)',
    backgroundColor: '#0f172a',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    borderRadius: 30,
  },
  downloadBtnOn: {
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 10,
  },
  downloadBtnOff: {
    backgroundColor: '#0f172a',
    opacity: 0.4,
  },
  downloadBtnText: {
    color: 'white',
    fontSize: 19,
    fontWeight: '900',
    marginLeft: 16,
    letterSpacing: -0.5,
  },
});
