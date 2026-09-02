import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Switch, Share, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button, Input, Icon } from '@/components/ui';
import { COLORS, SIZES, SHADOWS, RADIUS, SPACE } from '@/constants/theme';
import { useNavigation, useRoute } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useGroup, useUpdateGroup, useRegenerateInviteCode, useDeleteGroup, useLeaveGroup, useGroupStreak } from '@/hooks';
import { isAppError } from '@/services/errors';
import { useAuthStore } from '@/store/useAuthStore';

// Custom tactile switch
const TactileSwitch = ({ value, onValueChange, disabled }: { value: boolean; onValueChange: (val: boolean) => void; disabled?: boolean }) => {
  return (
    <Pressable
      onPress={() => {
        if (disabled) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange(!value);
      }}
      style={[
        styles.switchTrack,
        value ? styles.switchTrackActive : styles.switchTrackInactive,
        disabled ? { opacity: 0.4 } : null,
      ]}
    >
      <View style={[
        styles.switchThumb,
        value ? styles.switchThumbActive : styles.switchThumbInactive,
      ]} />
    </Pressable>
  );
};

export default function GroupSettingsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupId: string = route.params?.groupId;
  const { user } = useAuthStore();

  const { data: groupData } = useGroup(groupId);
  const group = groupData?.group;
  const members = groupData?.members ?? [];
  const isAdmin = !!members.find((m: any) => m.userId === user?.id && m.role === 'admin');

  const updateGroup = useUpdateGroup();
  const regenerateCode = useRegenerateInviteCode();
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();

  // Local form state (initialised from the loaded group)
  const [groupName, setGroupName] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('');
  const [requirePhoto, setRequirePhoto] = useState(false);
  const [groupStreakEnabled, setGroupStreakEnabled] = useState(false);

  useEffect(() => {
    if (group) {
      setGroupName(group.name);
      setGroupEmoji(group.emoji);
      setRequirePhoto(false); // would come from the group if we had a column
      setGroupStreakEnabled(group.groupStreakEnabled);
    }
  }, [group?.id, group?.name, group?.emoji, group?.groupStreakEnabled]);

  const handleSave = () => {
    if (!group) return;
    updateGroup.mutate(
      {
        groupId: group.id,
        updates: {
          name: groupName.trim() || group.name,
          emoji: groupEmoji || group.emoji,
          groupStreakEnabled,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        },
        onError: (err) => {
          Alert.alert('Save failed', isAppError(err) ? err.message : (err as Error).message);
        },
      }
    );
  };

  const handleCopyCode = async () => {
    if (!group) return;
    await Clipboard.setStringAsync(group.inviteCode);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Copied', 'Invite code copied to clipboard');
  };

  const handleShareCode = async () => {
    if (!group) return;
    try {
      await Share.share({
        message: `Join my StreakPact "${group.name}"! Code: ${group.inviteCode}\nstreakpact://invite/${group.inviteCode}`,
      });
    } catch (err) {
      Alert.alert((err as Error).message);
    }
  };

  const handleRegenerate = () => {
    if (!group) return;
    Alert.alert(
      'Regenerate invite code?',
      'The old code will stop working immediately. Existing members keep their access.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          style: 'destructive',
          onPress: () =>
            regenerateCode.mutate(group.id, {
              onError: (e) => Alert.alert('Error', isAppError(e) ? e.message : (e as Error).message),
            }),
        },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert('Leave group?', 'You will lose your streak in this pact.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave',
        style: 'destructive',
        onPress: () =>
          leaveGroup.mutate(groupId, {
            onSuccess: () => navigation.navigate('Main', { screen: 'Groups' }),
            onError: (e) => {
              if (isAppError(e) && e.code === 'NOT_ALLOWED') {
                Alert.alert('Cannot leave', 'Promote another admin before leaving.');
              } else {
                Alert.alert('Error', (e as Error).message);
              }
            },
          }),
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete pact?',
      'This cannot be undone. All submissions, streaks, and member data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () =>
            deleteGroup.mutate(groupId, {
              onSuccess: () => navigation.navigate('Main', { screen: 'Groups' }),
              onError: (e) => Alert.alert('Error', isAppError(e) ? e.message : (e as Error).message),
            }),
        },
      ]
    );
  };

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <Text variant="body" color={COLORS.textSecondary}>Loadingâ€¦</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={6} style={styles.backBtn}>
          <Icon name="arrow-left" size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text variant="eyebrow" color={COLORS.textSecondary}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Invite Code Section */}
        <View style={styles.section}>
          <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.sectionEyebrow}>
            Invite code
          </Text>
          <View style={styles.codeContainer}>
            <Text style={styles.codeText}>{group.inviteCode}</Text>
          </View>
          <View style={styles.actionRow}>
            <Button label="Copy code" variant="secondary" onPress={handleCopyCode} style={{ flex: 1, marginRight: 8 }} />
            <Button label="Share invite" onPress={handleShareCode} style={{ flex: 1, marginLeft: 8 }} />
          </View>
        </View>

        {isAdmin ? (
          <>
            <View style={styles.section}>
              <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.sectionEyebrow}>
                Group info
              </Text>
              <Input
                label="Name"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={30}
              />
              <View style={{ height: 12 }} />
              <Input
                label="Icon (emoji or text)"
                value={groupEmoji}
                onChangeText={setGroupEmoji}
                maxLength={4}
              />
              <View style={{ height: 16 }} />
              <Button
                label={updateGroup.isPending ? 'Savingâ€¦' : 'Save changes'}
                onPress={handleSave}
                disabled={updateGroup.isPending}
                loading={updateGroup.isPending}
                fullWidth
              />
            </View>

            <View style={styles.section}>
              <Text variant="eyebrow" color={COLORS.textSecondary} style={styles.sectionEyebrow}>
                Rules
              </Text>

              <View style={styles.settingRow}>
                <View style={styles.settingTextContainer}>
                  <Text variant="bodyMedium" color={COLORS.textPrimary}>Require photo proof</Text>
                  <Text variant="caption" color={COLORS.textSecondary}>Per-activity (set on each activity)</Text>
                </View>
                <TactileSwitch value={false} onValueChange={() => {}} disabled />
              </View>

              <View style={styles.settingRow}>
                <View style={styles.settingTextContainer}>
                  <Text variant="bodyMedium" color={COLORS.textPrimary}>Group streak</Text>
                  <Text variant="caption" color={COLORS.textSecondary}>If one person misses, everyone's streak resets</Text>
                </View>
                <TactileSwitch value={groupStreakEnabled} onValueChange={setGroupStreakEnabled} />
              </View>
            </View>

            <View style={styles.section}>
              <Text variant="eyebrow" color={COLORS.danger} style={styles.sectionEyebrow}>
                Danger zone
              </Text>
              <Button
                label="Regenerate invite code"
                variant="secondary"
                onPress={handleRegenerate}
                disabled={regenerateCode.isPending}
                fullWidth
                style={{ marginBottom: 12 }}
              />
              <Button
                label="Delete pact"
                variant="danger"
                onPress={handleDelete}
                disabled={deleteGroup.isPending}
                fullWidth
              />
            </View>
          </>
        ) : (
          <View style={styles.section}>
            <Text variant="eyebrow" color={COLORS.danger} style={styles.sectionEyebrow}>
              Danger zone
            </Text>
            <Button
              label="Leave pact"
              variant="danger"
              onPress={handleLeave}
              disabled={leaveGroup.isPending}
              fullWidth
            />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgBase },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  content: { paddingHorizontal: SPACE.xl, paddingBottom: 60 },
  section: { marginBottom: 28 },
  sectionEyebrow: { marginBottom: 12 },
  codeContainer: {
    backgroundColor: COLORS.bgSurface,
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 1, borderColor: COLORS.hairline,
  },
  codeText: {
    fontFamily: 'JetBrainsMono-Bold',
    fontSize: 40,
    color: COLORS.textPrimary,
    letterSpacing: 8,
  },
  actionRow: { flexDirection: 'row' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  settingTextContainer: { flex: 1, paddingRight: 16 },
  settingLabel: { color: COLORS.textPrimary, fontSize: 15, fontFamily: 'Inter-Medium' },
  settingSubLabel: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  switchTrack: {
    width: 50, height: 30, borderRadius: 15,
    padding: 2, justifyContent: 'center',
  },
  switchTrackActive: { backgroundColor: COLORS.accentBlue },
  switchTrackInactive: { backgroundColor: COLORS.hairlineStrong },
  switchThumb: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: { transform: [{ translateX: 20 }] },
  switchThumbInactive: { transform: [{ translateX: 0 }] },
});
