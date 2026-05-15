import { Tabs, useRouter } from 'expo-router';
import { Home, DownloadCloud, CheckCircle, Settings, Plus } from 'lucide-react-native';
import { View, StyleSheet, Pressable } from 'react-native';

export default function TabLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a', // Tailwind surface-900
          borderTopColor: '#1e293b', // Tailwind surface-800
          height: 80,
          paddingBottom: 24,
          paddingTop: 12,
        },
        tabBarActiveTintColor: '#38bdf8', // Tailwind primary-400
        tabBarInactiveTintColor: '#64748b', // Tailwind surface-500
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
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queue',
          tabBarIcon: ({ color }) => <DownloadCloud size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarIcon: () => (
            <View style={styles.addButtonContainer}>
              <View style={styles.addButton}>
                <Plus size={32} color="#ffffff" strokeWidth={1.5} />
              </View>
            </View>
          ),
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/add-modal');
          },
        }}
      />
      <Tabs.Screen
        name="completed"
        options={{
          title: 'Done',
          tabBarIcon: ({ color }) => <CheckCircle size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <Settings size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonContainer: {
    top: -15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 64,
    height: 64,
  },
  addButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0ea5e9', // primary-500
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
