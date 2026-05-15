import { View, Text, StyleSheet, Pressable, TextInput, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { X, Check } from 'lucide-react-native';
import { useState } from 'react';
import { FORMAT_PRESETS } from '../src/types/index';
import { DownloadService } from '../src/services/downloadService';

export default function AddModal() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [selectedPreset, setSelectedPreset] = useState('mp4_720p');

  const videoPresets = Object.values(FORMAT_PRESETS).filter(p => p.videoQuality !== 'none');
  const audioPresets = Object.values(FORMAT_PRESETS).filter(p => p.videoQuality === 'none');

  const handleAdd = () => {
    if (!url.trim()) return;
    DownloadService.addDownload(url, selectedPreset);
    router.back();
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Add Download</Text>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color="#94a3b8" />
        </Pressable>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>URL</Text>
        <TextInput
          style={styles.input}
          placeholder="https://youtube.com/watch?v=..."
          placeholderTextColor="#64748b"
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Text style={styles.label}>Video Format</Text>
        <View style={styles.presetGroup}>
          {videoPresets.map((preset) => (
            <Pressable
              key={preset.id}
              style={[styles.presetCard, selectedPreset === preset.id && styles.presetCardActive]}
              onPress={() => setSelectedPreset(preset.id)}
            >
              <Text style={[styles.presetLabel, selectedPreset === preset.id && styles.presetLabelActive]}>
                {preset.label}
              </Text>
              <Text style={[styles.presetDesc, selectedPreset === preset.id && styles.presetDescActive]}>
                {preset.description}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Audio Only</Text>
        <View style={styles.presetGroup}>
          {audioPresets.map((preset) => (
            <Pressable
              key={preset.id}
              style={[styles.presetCard, selectedPreset === preset.id && styles.presetCardActive]}
              onPress={() => setSelectedPreset(preset.id)}
            >
              <Text style={[styles.presetLabel, selectedPreset === preset.id && styles.presetLabelActive]}>
                {preset.label}
              </Text>
              <Text style={[styles.presetDesc, selectedPreset === preset.id && styles.presetDescActive]}>
                {preset.description}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={[styles.addButton, !url.trim() && styles.addButtonDisabled]} 
          onPress={handleAdd}
          disabled={!url.trim()}
        >
          <Check size={20} color="#ffffff" />
          <Text style={styles.addButtonText}>Add Download</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f8fafc',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    color: '#f8fafc',
    fontSize: 16,
  },
  presetGroup: {
    gap: 8,
  },
  presetCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  presetCardActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: '#38bdf8',
  },
  presetLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#e2e8f0',
    marginBottom: 4,
  },
  presetLabelActive: {
    color: '#38bdf8',
  },
  presetDesc: {
    fontSize: 13,
    color: '#64748b',
  },
  presetDescActive: {
    color: '#7dd3fc',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  addButton: {
    backgroundColor: '#0ea5e9',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
