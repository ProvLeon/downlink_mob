import { View, Text, StyleSheet, Pressable, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DownloadCloud, PlayCircle, HardDrive, Link as LinkIcon, CheckCircle } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { DownloadService, DownloadItem } from '../../src/services/downloadService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const unsubscribe = DownloadService.subscribe((data) => {
      setDownloads(data);
    });
    return unsubscribe;
  }, []);

  const activeCount = downloads.filter(d => d.status !== 'completed' && d.status !== 'failed').length;
  const completedCount = downloads.filter(d => d.status === 'completed').length;
  
  // Get latest 3 completed
  const recentCompleted = downloads
    .filter(d => d.status === 'completed')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <Image source={require('../../assets/downlink.png')} style={styles.headerLogo} resizeMode="contain" />
            <View>
              <Text style={styles.title}>Downlink</Text>
              <Text style={styles.subtitle}>Media Downloader</Text>
            </View>
          </View>
        </View>

        <Pressable style={styles.heroCard} onPress={() => router.push('/add-modal')}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <View style={styles.heroIconContainer}>
              <LinkIcon size={32} color="#0ea5e9" />
            </View>
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>Paste Link to Download</Text>
              <Text style={styles.heroSubtitle}>Supports over 1,000+ websites</Text>
            </View>
          </View>
        </Pressable>

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsContainer}>
          <Pressable style={styles.statCard} onPress={() => router.push('/queue')}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <DownloadCloud size={24} color="#38bdf8" />
            </View>
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active Queue</Text>
          </Pressable>
          <Pressable style={styles.statCard} onPress={() => router.push('/completed')}>
            <View style={[styles.statIconBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <CheckCircle size={24} color="#10b981" />
            </View>
            <Text style={styles.statValue}>{completedCount}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </Pressable>
        </View>

        {recentCompleted.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.sectionTitle}>Recent Downloads</Text>
              <Pressable onPress={() => router.push('/completed')}>
                <Text style={styles.seeAllText}>See All</Text>
              </Pressable>
            </View>
            {recentCompleted.map(item => (
              <View key={item.id} style={styles.recentItem}>
                {item.thumbnail ? (
                  <Image source={{ uri: item.thumbnail }} style={styles.recentThumbnail} />
                ) : (
                  <View style={styles.recentThumbnailPlaceholder}>
                    <PlayCircle size={24} color="#64748b" />
                  </View>
                )}
                <View style={styles.recentInfo}>
                  <Text style={styles.recentTitle} numberOfLines={1}>{item.title}</Text>
                  <Text style={styles.recentSub}>{item.preset.label}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 8,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerLogo: {
    width: 48,
    height: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#94a3b8',
    fontWeight: '500',
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    position: 'relative',
  },
  heroGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#0ea5e9',
    opacity: 0.1,
    transform: [{ scale: 1.5 }],
  },
  heroContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 16,
  },
  heroIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTextContainer: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 15,
    color: '#94a3b8',
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  recentSection: {
    marginTop: 8,
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0ea5e9',
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  recentThumbnail: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: '#0f172a',
  },
  recentThumbnailPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 14,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentInfo: {
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f8fafc',
    marginBottom: 4,
  },
  recentSub: {
    fontSize: 13,
    color: '#94a3b8',
  },
});
