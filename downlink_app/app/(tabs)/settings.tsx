import { View, Text, Pressable, ScrollView, Switch, Alert, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HardDrive, Bell, ChevronRight, Trash2, HelpCircle, Info, Video, ShieldAlert } from 'lucide-react-native';
import { useState } from 'react';
import * as Linking from 'expo-linking';
import * as Haptics from 'expo-haptics';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [defaultQuality, setDefaultQuality] = useState('1080p');

  const handleClearCache = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Clear Cache",
      "Are you sure you want to clear temporary files? This won't delete your completed downloads.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Cache has been cleared.");
          }
        }
      ]
    );
  };

  const handleQualityCycle = () => {
    const qualities = ['480p', '720p', '1080p', 'Best'];
    const currentIndex = qualities.indexOf(defaultQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    setDefaultQuality(qualities[nextIndex]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const openExternalLink = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open the link.");
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Storage Card */}
        <View style={styles.storageCard}>
          <View style={styles.cardRow}>
            <View style={styles.storageIconBox}>
              <HardDrive size={22} color="#38bdf8" />
            </View>
            <View style={styles.storageTextContainer}>
              <Text style={styles.storageTitle}>Device Storage</Text>
              <Text style={styles.storageSubtitle}>45.2 GB Used / 128 GB</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: '35%' }]} />
          </View>

          <View style={styles.storageStatsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#38bdf8' }]} />
              <Text style={styles.statLabel}>Downlink (2.4 GB)</Text>
            </View>
            <View style={styles.statItem}>
              <View style={[styles.statDot, { backgroundColor: '#334155' }]} />
              <Text style={styles.statLabel}>Other</Text>
            </View>
          </View>
        </View>

        {/* Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Preferences</Text>
          <View style={styles.settingsGroup}>

            <Pressable
              style={styles.settingItem}
              onPress={handleQualityCycle}
            >
              <View style={styles.settingLabelRow} pointerEvents="none">
                <View style={[styles.itemIconBox, { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.2)' }]}>
                  <Video size={20} color="#38bdf8" />
                </View>
                <Text style={styles.itemTitle}>Default Quality</Text>
              </View>
              <View style={styles.settingActionRow} pointerEvents="none">
                <Text style={styles.actionValueText}>{defaultQuality}</Text>
                <ChevronRight size={18} color="#64748b" />
              </View>
            </Pressable>

            <View style={styles.separator} />

            <View style={styles.settingItem}>
              <View style={styles.settingLabelRow} pointerEvents="none">
                <View style={[styles.itemIconBox, { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Bell size={20} color="#f59e0b" />
                </View>
                <Text style={styles.itemTitle}>Notifications</Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={(val) => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNotificationsEnabled(val);
                }}
                trackColor={{ false: '#1e293b', true: '#38bdf8' }}
                thumbColor={Platform.OS === 'ios' ? '#ffffff' : notificationsEnabled ? '#ffffff' : '#94a3b8'}
              />
            </View>
          </View>
        </View>

        {/* Data & Storage Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Data & Storage</Text>
          <View style={styles.settingsGroup}>
            <Pressable
              style={styles.settingItem}
              onPress={handleClearCache}
            >
              <View style={styles.settingLabelRow} pointerEvents="none">
                <View style={[styles.itemIconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]}>
                  <Trash2 size={20} color="#ef4444" />
                </View>
                <Text style={styles.itemTitle}>Clear Cache</Text>
              </View>
              <View style={styles.settingActionRow} pointerEvents="none">
                <Text style={styles.actionValueText}>145 MB</Text>
                <ChevronRight size={18} color="#64748b" />
              </View>
            </Pressable>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionHeading}>Support</Text>
          <View style={styles.settingsGroup}>
            <Pressable
              style={styles.settingItem}
              onPress={() => openExternalLink('https://github.com/orlixis/downlink/issues')}
            >
              <View style={styles.settingLabelRow} pointerEvents="none">
                <View style={[styles.itemIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                  <HelpCircle size={20} color="#10b981" />
                </View>
                <Text style={styles.itemTitle}>Help Center</Text>
              </View>
              <ChevronRight size={18} color="#64748b" pointerEvents="none" />
            </Pressable>

            <View style={styles.separator} />

            <Pressable
              style={styles.settingItem}
              onPress={() => openExternalLink('https://orlixis.github.io/downlink')}
            >
              <View style={styles.settingLabelRow} pointerEvents="none">
                <View style={[styles.itemIconBox, { backgroundColor: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }]}>
                  <ShieldAlert size={20} color="#6366f1" />
                </View>
                <Text style={styles.itemTitle}>Privacy Policy</Text>
              </View>
              <ChevronRight size={18} color="#64748b" pointerEvents="none" />
            </Pressable>

            <View style={styles.separator} />

            <Pressable
              style={styles.settingItem}
              onPress={() => openExternalLink('https://orlixis.github.io/downlink')}
            >
              <View style={styles.settingLabelRow} pointerEvents="none">
                <View style={[styles.itemIconBox, { backgroundColor: 'rgba(148, 163, 184, 0.1)', borderColor: 'rgba(148, 163, 184, 0.2)' }]}>
                  <Info size={20} color="#94a3b8" />
                </View>
                <Text style={styles.itemTitle}>About Downlink</Text>
              </View>
              <View style={styles.settingActionRow} pointerEvents="none">
                <Text style={styles.actionValueText}>v3.0.0</Text>
                <ChevronRight size={18} color="#64748b" />
              </View>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footerText}>
          Downlink Engine Powered by FFmpeg
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a', // Slate-900 (matches tab layout)
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.5,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  storageCard: {
    backgroundColor: '#1e293b', // Slate-800
    borderWidth: 1,
    borderColor: '#334155', // Slate-700
    borderRadius: 24,
    padding: 24,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  storageIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  storageTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  storageTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 4,
  },
  storageSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#0f172a',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#38bdf8',
    borderRadius: 4,
  },
  storageStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#64748b',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginBottom: 12,
    marginLeft: 8,
  },
  settingsGroup: {
    backgroundColor: '#1e293b',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    minHeight: 76,
  },
  settingLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f1f5f9',
  },
  settingActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionValueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
  },
  separator: {
    height: 1,
    backgroundColor: '#334155',
    marginLeft: 72,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 8,
  },
});
