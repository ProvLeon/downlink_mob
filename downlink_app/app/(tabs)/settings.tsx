import { View, Text, StyleSheet, Pressable, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HardDrive, Settings2, Moon, Bell, ChevronRight } from 'lucide-react-native';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Image source={require('../../assets/downlink.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.title}>Settings</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Storage Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconBox}>
              <HardDrive size={20} color="#38bdf8" />
            </View>
            <Text style={styles.cardTitle}>Storage</Text>
            <Text style={styles.cardSubtitle}>45.2 GB / 128 GB</Text>
          </View>
          
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '35%' }]} />
          </View>
          <Text style={styles.progressText}>35% Used</Text>
        </View>

        {/* Settings List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PREFERENCES</Text>
          
          <View style={styles.settingsGroup}>
            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#1e293b' }]}>
                  <Settings2 size={18} color="#94a3b8" />
                </View>
                <Text style={styles.settingLabel}>Download Quality</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>1080p</Text>
                <ChevronRight size={16} color="#64748b" />
              </View>
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#1e293b' }]}>
                  <Moon size={18} color="#94a3b8" />
                </View>
                <Text style={styles.settingLabel}>Theme</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>Dark</Text>
                <ChevronRight size={16} color="#64748b" />
              </View>
            </Pressable>

            <View style={styles.divider} />

            <Pressable style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#1e293b' }]}>
                  <Bell size={18} color="#94a3b8" />
                </View>
                <Text style={styles.settingLabel}>Notifications</Text>
              </View>
              <View style={styles.settingRight}>
                <Text style={styles.settingValue}>Enabled</Text>
                <ChevronRight size={16} color="#64748b" />
              </View>
            </Pressable>
          </View>
        </View>
      </ScrollView>

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    backgroundColor: '#0f172a',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'right',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
  },
  settingsGroup: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#e2e8f0',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingValue: {
    fontSize: 15,
    color: '#94a3b8',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginLeft: 60,
  },
});
