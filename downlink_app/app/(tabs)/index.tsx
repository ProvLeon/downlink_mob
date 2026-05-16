import { View, Text, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { DownloadCloud, PlayCircle, Link as LinkIcon, CheckCircle, Plus } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { DownloadService, DownloadItem } from '../../src/services/downloadService';

export default function HomeScreen() {
  const router = useRouter();
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);

  useEffect(() => {
    const unsubscribe = DownloadService.subscribe((data) => {
      setDownloads(data);
    });
    return unsubscribe;
  }, []);

  const activeDownloads = downloads.filter(d => d.status !== 'completed' && d.status !== 'failed');
  const activeCount = activeDownloads.length;
  const completedCount = downloads.filter(d => d.status === 'completed').length;

  const recentCompleted = downloads
    .filter(d => d.status === 'completed')
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  const topActive = activeDownloads.length > 0 ? activeDownloads[0] : null;

  return (
    <SafeAreaView className="flex-1 bg-[#0f172a]">
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>

        {/* Header Section */}
        <View className="flex-row justify-between items-center mb-8 pt-2">
          <View className="flex-row items-center gap-4">
            <View className="w-14 h-14 bg-slate-800 rounded-[18px] items-center justify-center border border-white/5">
              <Image source={require('../../assets/downlink.png')} className="w-8 h-8" resizeMode="contain" />
            </View>
            <View>
              <Text className="text-3xl font-extrabold text-slate-50 tracking-tight">Downlink</Text>
              <Text className="text-slate-400 text-sm font-medium mt-0.5">Premium Media Hub</Text>
            </View>
          </View>
        </View>

        {/* Hero Card */}
        <Pressable
          className="bg-blue-600 rounded-[28px] p-6 mb-8 overflow-hidden relative"
          onPress={() => router.push('/add-modal')}
          style={{ shadowColor: '#2563eb', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 10 }}
        >
          <View pointerEvents="none">
            <View className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full" />
            <View className="flex-row items-center gap-5">
              <View className="w-16 h-16 bg-white/20 rounded-[20px] items-center justify-center">
                <Plus size={32} color="white" strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-white text-[22px] font-bold tracking-tight mb-1">Add New Task</Text>
                <Text className="text-blue-100 text-[15px] font-medium leading-tight">Paste link to download from 1000+ sites</Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Live Download */}
        {topActive && (
          <View className="mb-8">
            <Text className="text-slate-500 text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">Live Download</Text>
            <Pressable
              className="bg-slate-800 border border-blue-500/20 rounded-[24px] p-5 relative overflow-hidden"
              onPress={() => router.push('/downloads')}
            >
              <View pointerEvents="none">
                <View className="absolute top-0 left-0 right-0 h-1 bg-blue-500/10" />
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center bg-blue-500/10 px-2.5 py-1.5 rounded-lg border border-blue-500/20">
                    <View className="w-2 h-2 rounded-full bg-blue-400 mr-2" />
                    <Text className="text-blue-400 text-[11px] font-bold uppercase tracking-wider">Active Now</Text>
                  </View>
                  <Text className="text-blue-400 text-sm font-semibold">{topActive.speed || '...'}</Text>
                </View>
                <Text className="text-slate-50 text-lg font-semibold mb-5 leading-snug" numberOfLines={1}>{topActive.title}</Text>
                <View>
                  <View className="h-2 bg-slate-900 rounded-full overflow-hidden mb-2.5">
                    <View className="h-full bg-blue-500 rounded-full" style={{ width: `${topActive.progress}%` }} />
                  </View>
                  <View className="flex-row justify-between">
                    <Text className="text-slate-400 text-[13px] font-medium">{Math.round(topActive.progress)}%</Text>
                    <Text className="text-slate-400 text-[13px] font-medium">{topActive.eta || '--:--'}</Text>
                  </View>
                </View>
              </View>
            </Pressable>
          </View>
        )}

        {/* Stats Overview */}
        <Text className="text-slate-500 text-[13px] font-bold uppercase tracking-widest mb-3 ml-1">Stats Overview</Text>
        <View className="flex-row gap-3 mb-8">
          <Pressable
            className="flex-1 bg-slate-800 border border-slate-700 rounded-[24px] p-5"
            onPress={() => router.push('/downloads')}
          >
            <View pointerEvents="none">
              <View className="w-12 h-12 bg-blue-500/10 rounded-2xl items-center justify-center mb-4">
                <DownloadCloud size={24} color="#3b82f6" />
              </View>
              <Text className="text-[32px] font-extrabold text-slate-50 mb-0.5">{activeCount}</Text>
              <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider">In Queue</Text>
            </View>
          </Pressable>
          <Pressable
            className="flex-1 bg-slate-800 border border-slate-700 rounded-[24px] p-5"
            onPress={() => router.push('/downloads')}
          >
            <View pointerEvents="none">
              <View className="w-12 h-12 bg-emerald-500/10 rounded-2xl items-center justify-center mb-4">
                <CheckCircle size={24} color="#10b981" />
              </View>
              <Text className="text-[32px] font-extrabold text-slate-50 mb-0.5">{completedCount}</Text>
              <Text className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Finished</Text>
            </View>
          </Pressable>
        </View>

        {/* Recent Activity */}
        {recentCompleted.length > 0 && (
          <View>
            <View className="flex-row justify-between items-center mb-4 px-1">
              <Text className="text-slate-500 text-[13px] font-bold uppercase tracking-widest">Recent Activity</Text>
              <Pressable onPress={() => router.push('/downloads')}>
                <Text className="text-blue-500 text-[13px] font-bold uppercase tracking-wider">See All</Text>
              </Pressable>
            </View>
            {recentCompleted.map((item, index) => (
              <Pressable
                key={item.id}
                className="flex-row items-center bg-slate-800 border border-slate-700 p-3.5 rounded-[20px] mb-3"
                onPress={() => router.push('/downloads')}
              >
                <View className="flex-row items-center flex-1" pointerEvents="none">
                  {item.thumbnail ? (
                    <Image source={{ uri: item.thumbnail }} className="w-14 h-14 rounded-[14px] bg-slate-900 mr-4" />
                  ) : (
                    <View className="w-14 h-14 rounded-[14px] bg-slate-900 mr-4 items-center justify-center">
                      <PlayCircle size={24} color="#64748b" />
                    </View>
                  )}
                  <View className="flex-1 justify-center">
                    <Text className="text-slate-50 font-semibold text-[15px] mb-1.5" numberOfLines={1}>{item.title}</Text>
                    <Text className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">{item.preset.label} • {item.size || 'Unknown'}</Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
