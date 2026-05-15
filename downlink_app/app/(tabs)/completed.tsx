import { View, Text, StyleSheet, FlatList, Pressable, Image } from 'react-native';
import { CheckCircle, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import * as Sharing from 'expo-sharing';
import { DownloadService, DownloadItem } from '../../src/services/downloadService';
import {SafeAreaView} from 'react-native-safe-area-context'

export default function CompletedScreen() {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const unsubscribe = DownloadService.subscribe((data) => {
      setDownloads(data.filter(d => d.status === 'completed'));
    });
    return unsubscribe;
  }, []);

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
          <View style={styles.detailsContainer}>
            <Text style={styles.detailsText}>{item.preset.label}</Text>
            <Text style={styles.detailsText}> • </Text>
            <Text style={styles.detailsText}>{item.size || 'Unknown size'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <Pressable
          style={[styles.actionButton, styles.shareButton]}
          onPress={() => handleShare(item)}
        >
          <Share2 size={16} color="#38bdf8" />
          <Text style={[styles.actionText, { color: '#38bdf8' }]}>Share</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.removeButton]}
          onPress={() => DownloadService.removeDownload(item.id)}
        >
          <Text style={[styles.actionText, { color: '#94a3b8' }]}>Remove</Text>
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
            <Text style={styles.title}>Completed</Text>
            <Text style={styles.subtitle}>{downloads.length} items downloaded</Text>
          </View>
        </View>
      </View>

      {downloads.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <CheckCircle size={48} color="#475569" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Nothing here yet</Text>
          <Text style={styles.emptySubtitle}>Completed downloads will appear here</Text>
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
    backgroundColor: '#0f172a',
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
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailsText: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  openButton: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  shareButton: {
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  removeButton: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    paddingHorizontal: 16,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
