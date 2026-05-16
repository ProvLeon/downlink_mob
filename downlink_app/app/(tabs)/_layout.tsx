import { Tabs, useRouter, usePathname } from 'expo-router';
import { Home, Compass, DownloadCloud, Settings, Plus } from 'lucide-react-native';
import { Pressable, View, StyleSheet, Platform } from 'react-native';
import { useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { DownloadService } from '../../src/services/downloadService';

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const isBrowser = pathname.includes('/browser');

  useEffect(() => {
    DownloadService.init();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          display: isBrowser ? 'none' : 'flex',
          backgroundColor: Platform.OS === 'ios' ? 'rgba(15, 23, 42, 0.85)' : '#0f172a',
          height: 84,
          paddingBottom: 24,
          paddingTop: 12,
          borderTopWidth: 0,
          elevation: 0,
          position: 'absolute', // Allow content to scroll behind
          bottom: 0,
          left: 0,
          right: 0,
        },
        tabBarBackground: () => (
          <View style={StyleSheet.absoluteFill}>
            {/* The Gradient Transition above the bar */}
            <LinearGradient
              colors={['transparent', '#0f172a']}
              style={{ position: 'absolute', top: -20, left: 0, right: 0, height: 50 }}
            />
            {/* The Bar Background itself */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15, 23, 42, 0.9)', borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' }]} />
          </View>
        ),
        tabBarActiveTintColor: '#38bdf8',
        tabBarInactiveTintColor: '#64748b',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <View pointerEvents="none"><Home size={24} color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="browser"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color }) => <View pointerEvents="none"><Compass size={24} color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: (props) => (
            <Pressable
              {...props}
              style={[{ top: -20, justifyContent: 'center', alignItems: 'center' }, props.style]}
              onPress={(e) => {
                e.preventDefault();
                router.push('/add-modal');
              }}
              hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
            >
              <View className="w-16 h-16 -top-3 rounded-full bg-sky-500 justify-center items-center shadow-lg shadow-sky-500/40" pointerEvents="none">
                <Plus size={32} color="#ffffff" strokeWidth={1.5} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          title: 'Downloads',
          tabBarIcon: ({ color }) => <View pointerEvents="none"><DownloadCloud size={24} color={color} /></View>,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <View pointerEvents="none"><Settings size={24} color={color} /></View>,
        }}
      />
    </Tabs>
  );
}
