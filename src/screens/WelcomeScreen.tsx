import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSession } from '../context/SessionContext';
import { DEPARTMENTS } from '../data/bodyRegions';
import { ScreenBackground } from '../components/ScreenBackground';
import { colors, spacing } from '../theme';
import { formField, formInput, formLabel, formValue } from '../styles/form';
import { ConfirmStackParamList } from '../types';
import { hasWebQaParam } from '../utils/webQuery';
import { AppIcon, appIcons } from '../components/AppIcon';

type Props = NativeStackScreenProps<ConfirmStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { session, setRole, update } = useSession();
  const [picker, setPicker] = useState<'dept' | null>(null);
  const [deptQuery, setDeptQuery] = useState('');

  /** Demo 验收：仅 Web 带 qa= 时填入患者信息并进入指认页 */
  useEffect(() => {
    if (!hasWebQaParam()) return;
    setRole('patient');
    update({ patientName: '验收', admissionNo: 'DEMO001' });
    const t = setTimeout(() => navigation.navigate('ConfirmSite'), 80);
    return () => clearTimeout(t);
  }, [navigation, setRole, update]);

  const canStart =
    session.patientName.trim().length > 0 &&
    session.admissionNo.trim().length > 0 &&
    (session.role === 'patient' || session.familyName.trim().length > 0);

  const filteredDepts = DEPARTMENTS.filter((d) =>
    d.includes(deptQuery.trim()),
  );

  const openDeptPicker = () => {
    setDeptQuery('');
    setPicker('dept');
  };

  const closeDeptPicker = () => {
    setPicker(null);
    setDeptQuery('');
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
          <View style={styles.pageBody}>
          <View>
          <Text style={styles.pageTitle}>开始确认</Text>
          <Text style={styles.pageSub}>
            访视护士引导 · 选择身份并填写患者信息
          </Text>

          <Text style={styles.section}>请选择身份</Text>
          <View style={styles.roleList}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRole('patient')}
            style={[
              styles.roleCard,
              session.role === 'patient' && styles.rolePatientActive,
            ]}
          >
            {session.role === 'patient' ? (
              <View style={styles.roleCheck}>
                <AppIcon name={appIcons.check} size={32} color={colors.patient} />
              </View>
            ) : null}
            <View
              style={[
                styles.roleIcon,
                session.role === 'patient' && styles.roleIconPatient,
              ]}
            >
              <AppIcon
                name={appIcons.patient}
                size={24}
                color={
                  session.role === 'patient' ? colors.patient : colors.muted
                }
              />
            </View>
            <View style={styles.roleCopy}>
              <Text
                style={[
                  styles.roleTitle,
                  session.role === 'patient' && styles.roleTitlePatient,
                ]}
              >
                我是患者
              </Text>
              <Text style={styles.roleDesc}>本人确认手术部位</Text>
            </View>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRole('family')}
            style={[
              styles.roleCard,
              session.role === 'family' && styles.roleFamilyActive,
            ]}
          >
            {session.role === 'family' ? (
              <View style={styles.roleCheck}>
                <AppIcon name={appIcons.check} size={32} color={colors.family} />
              </View>
            ) : null}
            <View
              style={[
                styles.roleIcon,
                session.role === 'family' && styles.roleIconFamily,
              ]}
            >
              <AppIcon
                name={appIcons.family}
                size={24}
                color={
                  session.role === 'family' ? colors.family : colors.muted
                }
              />
            </View>
            <View style={styles.roleCopy}>
              <Text
                style={[
                  styles.roleTitle,
                  session.role === 'family' && styles.roleTitleFamily,
                ]}
              >
                我是家属
              </Text>
              <Text style={styles.roleDesc}>协助患者一起确认</Text>
            </View>
          </Pressable>
          </View>

          <Text style={styles.section}>患者信息</Text>
          <Pressable style={styles.field} onPress={openDeptPicker}>
            <Text style={styles.label}>科室</Text>
            <Text style={styles.value}>{session.department}</Text>
          </Pressable>
          <View style={styles.field}>
            <Text style={styles.label}>姓名</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入患者姓名"
              placeholderTextColor={colors.muted}
              value={session.patientName}
              onChangeText={(patientName) => update({ patientName })}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.label}>住院号</Text>
            <TextInput
              style={styles.input}
              placeholder="请输入住院号"
              placeholderTextColor={colors.muted}
              value={session.admissionNo}
              onChangeText={(admissionNo) => update({ admissionNo })}
              autoCapitalize="characters"
            />
          </View>
          {session.role === 'family' ? (
            <View style={styles.field}>
              <Text style={styles.label}>家属姓名</Text>
              <TextInput
                style={styles.input}
                placeholder="确认人姓名（家属）"
                placeholderTextColor={colors.muted}
                value={session.familyName}
                onChangeText={(familyName) => update({ familyName })}
              />
            </View>
          ) : null}
          </View>

          <Pressable
            style={[styles.cta, !canStart && styles.ctaDisabled]}
            disabled={!canStart}
            onPress={() => navigation.navigate('ConfirmSite')}
          >
            <Text style={[styles.ctaText, !canStart && styles.ctaTextDisabled]}>
              开始确认
            </Text>
          </Pressable>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

        <Modal visible={picker !== null} transparent animationType="fade">
          <Pressable style={styles.modalMask} onPress={closeDeptPicker}>
            <Pressable
              style={styles.modalSheet}
              onPress={(e) => e.stopPropagation()}
            >
              <Text style={styles.modalTitle}>选择科室</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="搜索科室，如：骨科、普外"
                placeholderTextColor={colors.muted}
                value={deptQuery}
                onChangeText={setDeptQuery}
                autoFocus
              />
              <FlatList
                data={filteredDepts}
                keyExtractor={(item) => item}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text style={styles.emptyText}>无匹配科室</Text>
                }
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.modalItem}
                    onPress={() => {
                      update({ department: item });
                      closeDeptPicker();
                    }}
                  >
                    <Text style={styles.modalItemText}>{item}</Text>
                  </Pressable>
                )}
              />
            </Pressable>
          </Pressable>
        </Modal>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
  },
  pageBody: {
    flexGrow: 1,
    paddingHorizontal: spacing.md,
    paddingTop: 8,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  pageTitle: { fontSize: 25, fontWeight: '800', color: colors.ink },
  pageSub: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 18,
  },
  section: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 6,
    marginBottom: 6,
  },
  roleList: {
    width: '100%',
    zIndex: 2,
    gap: 8,
  },
  roleCard: {
    width: '100%',
    minHeight: 80,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    paddingRight: 50,
    borderWidth: 2,
    borderColor: colors.line,
    position: 'relative',
    zIndex: 2,
    cursor: 'pointer',
    outlineStyle: 'none',
  },
  rolePatientActive: {
    borderColor: colors.patient,
    backgroundColor: colors.successSoft,
  },
  roleFamilyActive: {
    borderColor: colors.family,
    backgroundColor: colors.primarySoft,
  },
  roleCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  roleIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EEF3F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleIconPatient: { backgroundColor: '#CDEADB' },
  roleIconFamily: { backgroundColor: '#C9DFF0' },
  roleCopy: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.ink,
    marginBottom: 3,
  },
  roleTitlePatient: { color: colors.patient },
  roleTitleFamily: { color: colors.family },
  roleDesc: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
  field: {
    ...formField,
    paddingVertical: 12,
    marginBottom: 7,
  },
  label: {
    ...formLabel,
    fontSize: 12,
    marginBottom: 3,
  },
  value: {
    ...formValue,
    fontSize: 16,
  },
  input: {
    ...formInput,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 28,
  },
  cta: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    width: '100%',
  },
  ctaDisabled: { backgroundColor: '#E2E8F0' },
  ctaText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  ctaTextDisabled: { color: colors.muted },
  modalMask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '60%',
    paddingBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 10,
    color: colors.ink,
  },
  searchInput: {
    marginHorizontal: spacing.md,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: '#F7FAFC',
  },
  emptyText: {
    textAlign: 'center',
    color: colors.muted,
    paddingVertical: 24,
    fontSize: 14,
  },
  modalItem: { paddingVertical: 14, paddingHorizontal: spacing.lg },
  modalItemText: { fontSize: 16, color: colors.ink },
});
