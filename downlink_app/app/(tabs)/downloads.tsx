import { View, Text, FlatList, Pressable, Image, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Trash2, CheckCircle, Share2, PlayCircle, Download } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import { DownloadService, DownloadItem } from '../../src/services/downloadService';
import { useRouter } from 'expo-router';

export default function DownloadsScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = DownloadService.subscribe((data) => {
      setDownloads(data);
    });
    return unsubscribe;
  }, []);

  const activeDownloads = downloads.filter(d => d.status !== 'completed');
  const completedDownloads = downloads.filter(d => d.status === 'completed');

  const currentData = activeTab === 'active' ? activeDownloads : completedDownloads;

  const handleShare = async (item: DownloadItem) => {
    if (!item.localUri) return;
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(item.localUri, {
        mimeType: item.preset.container === 'mp3' ? 'audio/mpeg' : 'video/mp4',
        dialogTitle: `Share: ${item.title}`,
      });
    }
  };

  const handlePlay = async (item: DownloadItem) => {
    if (!item.localUri) return;
    // Navigate to the dedicated in-app player
    router.push({
      pathname: '/player',
      params: { uri: item.localUri, title: item.title }
    });
  };
  const renderActiveItem = (item: DownloadItem) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Image source={require('../../assets/downlink.png')} style={styles.logoOpacity} resizeMode="contain" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.cardMetaRow}>
            <View style={styles.presetBadge}>
              <Text style={styles.presetText}>{item.preset.label}</Text>
            </View>
            <Text style={styles.statusText}>
              {item.status === 'downloading' ? item.speed ?? 'Downloading…'
                : item.status === 'paused' ? 'Paused'
                  : item.status === 'fetching_info' ? 'Fetching info…'
                    : item.status === 'merging' ? 'Merging streams…'
                      : item.status === 'saving' ? 'Saving to gallery…'
                        : item.status === 'failed' ? `Failed`
                          : 'Pending…'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: `${item.progress}%` }]} />
        </View>
        <View style={styles.progressMeta}>
          <Text style={styles.progressText}>{Math.round(item.progress)}%</Text>
          <Text style={styles.progressText}>{item.eta ? `ETA: ${item.eta}` : ''}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        {item.status === 'downloading' ? (
          <Pressable
            style={[styles.actionBtn, styles.pauseBtn]}
            onPress={() => DownloadService.pauseDownload(item.id)}
          >
            <View style={styles.rowCenter} pointerEvents="none">
              <Pause size={16} color="#f59e0b" />
              <Text style={styles.pauseBtnText}>Pause</Text>
            </View>
          </Pressable>
        ) : item.status === 'paused' ? (
          <Pressable
            style={[styles.actionBtn, styles.resumeBtn]}
            onPress={() => DownloadService.resumeDownload(item.id)}
          >
            <View style={styles.rowCenter} pointerEvents="none">
              <Play size={16} color="#10b981" />
              <Text style={styles.resumeBtnText}>Resume</Text>
            </View>
          </Pressable>
        ) : (
          <View style={[styles.actionBtn, styles.workingBtn]}>
            <Text style={styles.workingBtnText}>Working…</Text>
          </View>
        )}

        <Pressable
          style={[styles.actionBtn, styles.cancelBtn]}
          onPress={() => DownloadService.removeDownload(item.id)}
        >
          <View style={styles.rowCenter} pointerEvents="none">
            <Trash2 size={16} color="#ef4444" />
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );

  const renderCompletedItem = (item: DownloadItem) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <PlayCircle size={24} color="#64748b" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.completedMetaRow}>
            <Text style={styles.completedMetaText}>{item.preset.label}</Text>
            <Text style={styles.completedMetaDot}>•</Text>
            <Text style={styles.completedMetaText}>{item.size || 'Unknown'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.cardActions}>
        {/* Using NativeWind for Play button as requested */}
        <Pressable
          className="flex-1 bg-emerald-500/10 rounded-[12px] py-3 flex-row items-center justify-center gap-2 active:bg-emerald-500/20"
          onPress={() => handlePlay(item)}
        >
          <Play size={16} color="#10b981" />
          <Text className="text-[#10b981] text-[14px] font-extrabold">Play</Text>
        </Pressable>

        <Pressable
          style={[styles.actionBtn, styles.shareBtn]}
          onPress={() => handleShare(item)}
        >
          <View style={styles.rowCenter} pointerEvents="none">
            <Share2 size={16} color="#3b82f6" />
            <Text style={styles.shareBtnText}>Share</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.actionBtn, styles.removeBtn]}
          onPress={() => DownloadService.removeDownload(item.id)}
        >
          <View style={styles.rowCenter} pointerEvents="none">
            <Trash2 size={16} color="#94a3b8" />
            <Text style={styles.removeBtnText}>Remove</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Downloads</Text>

        {/* Segmented Control */}
        <View style={styles.segmentedControl}>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'active' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.segmentText, activeTab === 'active' && styles.segmentTextActive]}>
              Active ({activeDownloads.length})
            </Text>
          </Pressable>
          <Pressable
            style={[styles.segmentBtn, activeTab === 'completed' && styles.segmentBtnActive]}
            onPress={() => setActiveTab('completed')}
          >
            <Text style={[styles.segmentText, activeTab === 'completed' && styles.segmentTextActive]}>
              Completed ({completedDownloads.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {currentData.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconBox}>
            {activeTab === 'active' ? (
              <Download size={40} color="#64748b" strokeWidth={1.5} />
            ) : (
              <CheckCircle size={40} color="#64748b" strokeWidth={1.5} />
            )}
          </View>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptyDesc}>
            {activeTab === 'active'
              ? 'Your active downloads will appear here.'
              : 'Your completed downloads will appear here.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => activeTab === 'active' ? renderActiveItem(item) : renderCompletedItem(item)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate-900
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pageHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
    marginBottom: 24,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1e293b', // Slate-800
    borderWidth: 1,
    borderColor: '#334155', // Slate-700
    borderRadius: 16,
    padding: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  segmentBtnActive: {
    backgroundColor: '#0f172a', // Slate-900
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#f8fafc',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 32,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 15,
    fontWeight: '500',
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 24,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  thumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  logoOpacity: {
    width: 24,
    height: 24,
    opacity: 0.3,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
    lineHeight: 22,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  presetBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  presetText: {
    color: '#60a5fa', // Blue-400
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#3b82f6', // Blue-500
    borderRadius: 4,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBtn: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)', // Amber
  },
  pauseBtnText: {
    color: '#f59e0b',
    fontSize: 14,
    fontWeight: '800',
  },
  resumeBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)', // Emerald
  },
  resumeBtnText: {
    color: '#10b981',
    fontSize: 14,
    fontWeight: '800',
  },
  workingBtn: {
    backgroundColor: 'rgba(51, 65, 85, 0.3)', // Slate
    opacity: 0.5,
  },
  workingBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
  },
  cancelBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)', // Red
  },
  cancelBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '800',
  },
  completedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  completedMetaText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  completedMetaDot: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  shareBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)', // Blue
  },
  shareBtnText: {
    color: '#3b82f6',
    fontSize: 14,
    fontWeight: '800',
  },
  removeBtn: {
    backgroundColor: 'rgba(51, 65, 85, 0.5)', // Slate
  },
  removeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
  },
});
