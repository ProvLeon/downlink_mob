import { View, Text, StyleSheet, FlatList, Dimensions, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Pause, Trash2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { DownloadService, DownloadItem } from '../../src/services/downloadService';

const { width } = Dimensions.get('window');

export default function QueueScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const unsubscribe = DownloadService.subscribe((data) => {
      setDownloads(data.filter(d => d.status !== 'completed'));
    });
    return unsubscribe;
  }, []);

  const renderItem = ({ item }: { item: DownloadItem }) => (
    <View style={styles.downloadCard}>
      <View style={styles.cardHeader}>
        {item.thumbnail ? (
          <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Image source={require('../../assets/downlink.png')} style={{width: 24, height: 24, opacity: 0.5}} resizeMode="contain" />
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.preset.label}</Text>
            </View>
            <Text style={styles.statusText}>
              {item.status === 'downloading' ? item.speed ?? 'Downloading…' 
               : item.status === 'paused' ? 'Paused'
               : item.status === 'fetching_info' ? 'Fetching info…'
               : item.status === 'merging' ? 'Merging streams…'
               : item.status === 'saving' ? 'Saving to gallery…'
               : item.status === 'failed' ? `Failed: ${item.error ?? 'unknown'}` 
               : 'Pending…'}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
        <View style={styles.progressStats}>
          <Text style={styles.statsText}>{Math.round(item.progress)}%</Text>
          <Text style={styles.statsText}>{item.eta ? `ETA: ${item.eta}` : ''}</Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        {item.status === 'downloading' ? (
          <Pressable 
            style={[styles.actionButton, styles.pauseButton]} 
            onPress={() => DownloadService.pauseDownload(item.id)}
          >
            <Pause size={16} color="#f59e0b" />
            <Text style={[styles.actionText, { color: '#f59e0b' }]}>Pause</Text>
          </Pressable>
        ) : item.status === 'paused' ? (
          <Pressable 
            style={[styles.actionButton, styles.resumeButton]} 
            onPress={() => DownloadService.resumeDownload(item.id)}
          >
            <Play size={16} color="#10b981" />
            <Text style={[styles.actionText, { color: '#10b981' }]}>Resume</Text>
          </Pressable>
        ) : (
          // merging / fetching_info / saving — show disabled state
          <View style={[styles.actionButton, { flex: 1, opacity: 0.4 }]}>
            <Text style={[styles.actionText, { color: '#94a3b8' }]}>Working…</Text>
          </View>
        )}
        
        <Pressable 
          style={[styles.actionButton, styles.cancelButton]} 
          onPress={() => DownloadService.removeDownload(item.id)}
        >
          <Trash2 size={16} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Image source={require('../../assets/downlink.png')} style={styles.headerLogo} resizeMode="contain" />
          <View>
            <Text style={styles.title}>Queue</Text>
            <Text style={styles.subtitle}>{downloads.length} downloads active</Text>
          </View>
        </View>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Image source={require('../../assets/downlink.png')} style={{width: 48, height: 48, opacity: 0.5}} resizeMode="contain" />
          </View>
          <Text style={styles.emptyTitle}>Queue is clear</Text>
          <Text style={styles.emptySubtitle}>Tap the + button to add new downloads</Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // surface-900
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerLogo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  downloadCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#0f172a',
  },
  thumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 8,
    lineHeight: 22,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38bdf8',
  },
  statusText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statsText: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  pauseButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  resumeButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  cancelButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
