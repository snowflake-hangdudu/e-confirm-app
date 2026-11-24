import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  FlatList,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import {
  SafeAreaView,
  initialWindowMetrics,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { BodyMap } from '../components/BodyMap';
import { ScreenBackground } from '../components/ScreenBackground';
import { SignatureSheet } from '../components/SignatureSheet';
import { SignaturePreview } from '../components/SignaturePad';
import { useSession } from '../context/SessionContext';
import {
  filterPartsForPick,
  HighlighterPick,
} from '../data/bodyHighlighterMap';
import { getPartById, getPartsByIds, zoneDisplayName } from '../data/bodyRegions';
import { colors, spacing } from '../theme';
import { BodyView, ConfirmStackParamList } from '../types';
import { speakSiteConfirm, stopSiteSpeech } from '../utils/speech';
import { getWebSearchParam } from '../utils/webQuery';
import { showAlert } from '../utils/showAlert';
import { appendConfirmRecord } from '../data/confirmRecords';
import { uploadRecords, syncConfirmRecordsToServer } from '../api/server';
import { signaturePathsToDataUrl } from '../utils/signatureImage';

type Props = NativeStackScreenProps<ConfirmStackParamList, 'ConfirmSite'>;

export function ConfirmSiteScreen({ navigation }: Props) {
  const { session, update, reset } = useSession();
  const insets = useSafeAreaInsets();
  const { height: liveH, width: winW } = useWindowDimensions();
  /** 键盘收起时 window 高度会回弹，人体图按启动时的窗口高度计算，避免进页弹一下 */
  const winH = Math.max(liveH, initialWindowMetrics?.frame.height ?? liveH);
  const isTablet = Math.min(winW, winH) >= 600;
  /** 人体图高度：手机保持原区间；平板抬高，但不挤掉底部操作区 */
  const mapHeight = isTablet
    ? Math.max(560, Math.min(Math.round(winH * 0.62), 880))
    : Math.max(360, Math.min(520, Math.round(winH * 0.55)));
  /** 标签最多展示 3 行，超出才在标签区滑动 */
  const chipMaxHeight = 40 * 3;
  const [chipContentH, setChipContentH] = useState(0);
  const chipScrollable = chipContentH > chipMaxHeight + 2;
  const [view, setView] = useState<BodyView>(session.bodyView || 'front');
  const [gender, setGender] = useState<'male' | 'female'>(
    session.bodyGender || 'male',
  );
  const [zonePicker, setZonePicker] = useState<HighlighterPick | null>(null);
  const [signOpen, setSignOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [nurseDone, setNurseDone] = useState(!!session.confirmedAt);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'ok' | 'fail'>('idle');

  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSiteSpeech();
        setSpeaking(false);
      };
    }, []),
  );

  useEffect(() => {
    if (session.confirmedAt) setNurseDone(true);
  }, [session.confirmedAt]);

  useEffect(() => {
    const qa = getWebSearchParam('qa');
    const g = getWebSearchParam('gender');
    if (!qa && !g) return;
    const nextGender =
      g === 'female' || g === 'male' ? g : session.bodyGender || 'female';
    const nextIds = qa
      ? qa.split(',').map((s) => s.trim()).filter(Boolean)
      : [];
    const hasBack = nextIds.some((id) => getPartById(id)?.view === 'back');
    const nextView: BodyView = hasBack ? 'back' : 'front';
    setGender(nextGender);
    setView(nextView);
    update({
      bodyGender: nextGender,
      bodyView: nextView,
      selectedPartIds: nextIds,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedParts = useMemo(
    () => getPartsByIds(session.selectedPartIds),
    [session.selectedPartIds],
  );
  useEffect(() => {
    setChipContentH(0);
  }, [session.selectedPartIds]);
  const selectedLabels = useMemo(
    () => selectedParts.map((p) => p.label),
    [selectedParts],
  );
  const zoneOptions = useMemo(
    () => (zonePicker ? filterPartsForPick(zonePicker) : []),
    [zonePicker],
  );

  const addPart = (partId: string) => {
    const next = session.selectedPartIds.includes(partId)
      ? session.selectedPartIds
      : [...session.selectedPartIds, partId];
    update({
      selectedPartIds: next,
      bodyView: view,
      bodyGender: gender,
      siteSubmitted: false,
    });
  };

  const removePart = (partId: string) => {
    update({
      selectedPartIds: session.selectedPartIds.filter((id) => id !== partId),
      siteSubmitted: false,
    });
  };

  const clearAllParts = () => {
    if (!session.selectedPartIds.length) return;
    update({ selectedPartIds: [], siteSubmitted: false });
  };

  const togglePart = (partId: string) => {
    if (session.selectedPartIds.includes(partId)) removePart(partId);
    else addPart(partId);
  };

  const onPick = (pick: HighlighterPick) => {
    const list = filterPartsForPick(pick);
    if (list.length === 1) {
      togglePart(list[0].id);
      return;
    }
    if (list.length === 0) {
      showAlert('这里暂时还没有可选的手术部位');
      return;
    }
    setZonePicker(pick);
  };

  const speak = async () => {
    if (!selectedLabels.length || speaking) return;
    setSpeaking(true);
    try {
      await speakSiteConfirm(selectedLabels);
    } finally {
      setSpeaking(false);
    }
  };

  const locked = session.siteSubmitted;

  const goHome = () => {
    reset();
    navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const onSubmitSite = () => {
    if (locked) return;
    if (!selectedParts.length) {
      showAlert('请先在图上选一个手术部位');
      return;
    }
    if (session.role === 'family' && !session.familySigned) {
      showAlert('请家属先签字');
      return;
    }
    update({
      siteSubmitted: true,
      bodyView: view,
      bodyGender: gender,
    });
  };

  const onReselect = () => {
    const hasContent =
      session.selectedPartIds.length > 0 ||
      session.siteSubmitted ||
      session.familySigned ||
      nurseDone;
    const doReset = () => {
      setNurseDone(false);
      update({
        selectedPartIds: [],
        siteSubmitted: false,
        familySigned: false,
        familySignaturePaths: [],
        confirmedAt: null,
        compareResult: null,
        reselectCount: session.reselectCount + (hasContent ? 1 : 0),
      });
    };
    if (!hasContent) {
      doReset();
      return;
    }
    showAlert('重新选择？', '已选部位和签字会清空，需要重新确认。', [
      { text: '取消', style: 'cancel' },
      { text: '确定清空', style: 'destructive', onPress: doReset },
    ]);
  };

  const switchGender = (next: 'male' | 'female') => {
    if (locked) {
      showAlert('已经提交了', '要改的话，请先点「重新选择」');
      return;
    }
    if (gender === next) return;
    const apply = () => {
      setGender(next);
      setZonePicker(null);
      update({
        bodyGender: next,
        selectedPartIds: [],
        siteSubmitted: false,
      });
    };
    if (session.selectedPartIds.length === 0) {
      apply();
      return;
    }
    showAlert('切换人体图？', '已选部位会清空，需要重新点选。', [
      { text: '取消', style: 'cancel' },
      { text: '确定切换', style: 'destructive', onPress: apply },
    ]);
  };

  const onNurseConfirm = async () => {
    if (!selectedParts.length) {
      showAlert('请先选好手术部位');
      return;
    }
    if (!session.siteSubmitted) {
      showAlert('请先点「提交」，确认患者选好的部位');
      return;
    }
    if (session.role === 'family' && !session.familySigned) {
      showAlert('请家属先签字');
      return;
    }
    const confirmedAt = new Date().toISOString();
    const confirmerName =
      session.role === 'family'
        ? session.familyName.trim() || session.patientName.trim() || '家属'
        : session.patientName.trim();
    const firstPickCorrect = session.reselectCount === 0;

    update({
      confirmedAt,
      bodyView: view,
      bodyGender: gender,
      compareResult: 'match',
    });

    try {
      const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        confirmedAt,
        department: session.department,
        admissionNo: session.admissionNo.trim(),
        firstPickCorrect,
        confirmerName,
        siteLabels: selectedLabels,
        role: session.role,
        nurseName: session.nurseName,
        patientName: session.patientName.trim(),
        signatureImage:
          session.role === 'family'
            ? signaturePathsToDataUrl(session.familySignaturePaths)
            : '',
        synced: false,
      };
      await appendConfirmRecord(record);
      setNurseDone(true);
      const result = await uploadRecords([record]);
      setSyncStatus(result.ok ? 'ok' : 'fail');
      if (!result.ok) {
        void syncConfirmRecordsToServer();
      }
    } catch {
      showAlert('本机保存记录失败，不影响本次确认完成');
      setNurseDone(true);
    }
  };

  const onPickGuarded = (pick: HighlighterPick) => {
    if (locked) {
      showAlert('已经提交了', '要改的话，请先点「重新选择」');
      return;
    }
    onPick(pick);
  };

  return (
    <ScreenBackground>
      <SafeAreaView style={styles.safe} edges={['left', 'right', 'bottom']}>
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.pageContent}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces
        >
          <View style={styles.toolbar}>
            <View style={styles.tabs}>
              <Pressable
                style={[styles.tab, view === 'front' && styles.tabActive]}
                onPress={() => setView('front')}
              >
                <Text
                  style={[
                    styles.tabText,
                    view === 'front' && styles.tabTextActive,
                  ]}
                >
                  正面
                </Text>
              </Pressable>
              <Pressable
                style={[styles.tab, view === 'back' && styles.tabActive]}
                onPress={() => setView('back')}
              >
                <Text
                  style={[
                    styles.tabText,
                    view === 'back' && styles.tabTextActive,
                  ]}
                >
                  背面
                </Text>
              </Pressable>
            </View>
            <View style={styles.genderRow}>
              <Pressable
                style={[
                  styles.genderChip,
                  gender === 'male' && styles.genderChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="选择男性"
                onPress={() => switchGender('male')}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === 'male' && styles.genderTextActive,
                  ]}
                >
                  男
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.genderChip,
                  gender === 'female' && styles.genderChipActive,
                ]}
                accessibilityRole="button"
                accessibilityLabel="选择女性"
                onPress={() => switchGender('female')}
              >
                <Text
                  style={[
                    styles.genderText,
                    gender === 'female' && styles.genderTextActive,
                  ]}
                >
                  女
                </Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.hint} numberOfLines={1}>
            点图选部位；图为示意，以文书名称为准
          </Text>

          <View style={[styles.mapBox, { height: mapHeight }]}>
            <BodyMap
              view={view}
              gender={gender}
              selectedPartIds={session.selectedPartIds}
              onPick={onPickGuarded}
            />
          </View>

          <View style={styles.footer}>
            <View style={styles.resultRow}>
              <View style={styles.resultMain}>
                <View style={styles.resultLabelRow}>
                  <Text style={styles.resultLabel}>
                    {locked ? '已确认的部位' : '已选部位（点一下可取消）'}
                  </Text>
                  {!locked && selectedParts.length > 0 && (
                    <Pressable onPress={clearAllParts} hitSlop={8}>
                      <Text style={styles.clearAll}>清空</Text>
                    </Pressable>
                  )}
                </View>
                {selectedParts.length === 0 ? (
                  <Text style={styles.resultPlaceholder}>
                    请点图上的部位
                  </Text>
                ) : (
                  <ScrollView
                    style={[
                      styles.chipScroll,
                      { maxHeight: chipMaxHeight },
                      chipScrollable ? { height: chipMaxHeight } : null,
                    ]}
                    contentContainerStyle={styles.chipScrollContent}
                    nestedScrollEnabled
                    scrollEnabled={chipScrollable}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    onContentSizeChange={(_w, h) => setChipContentH(h)}
                  >
                    <View style={styles.chipRow}>
                      {selectedParts.map((p) => (
                        <Pressable
                          key={p.id}
                          style={[styles.chip, locked && styles.chipLocked]}
                          disabled={locked}
                          onPress={() => removePart(p.id)}
                        >
                          <Text style={styles.chipText}>
                            {locked ? p.label : `${p.label} \u00d7`}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                )}
              </View>
              <Pressable
                style={[
                  styles.speaker,
                  (!selectedLabels.length || speaking) && { opacity: 0.4 },
                ]}
                disabled={!selectedLabels.length || speaking}
                onPress={speak}
              >
                <Text style={styles.speakerText}>
                  {speaking ? '正在读…' : '\uD83D\uDD0A'}
                </Text>
              </Pressable>
            </View>

            {session.role === 'family' && (
              <Pressable
                style={[styles.signBox, session.familySigned && styles.signDone]}
                disabled={locked}
                onPress={() => {
                  if (locked) {
                    showAlert('已经提交了', '要改签字，请先点「重新选择」');
                    return;
                  }
                  setSignOpen(true);
                }}
              >
                {session.familySigned &&
                session.familySignaturePaths.length > 0 ? (
                  <>
                    <Text style={styles.signDoneLabel}>
                      {'\u2713 '}
                      家属已签字
                      {locked ? '' : '（点这里可重签）'}
                    </Text>
                    <SignaturePreview
                      paths={session.familySignaturePaths}
                      height={48}
                    />
                  </>
                ) : (
                  <>
                    <Text style={styles.signTitle}>
                      请家属签字（必填）
                    </Text>
                    <Text style={styles.signText}>点这里打开签字板</Text>
                  </>
                )}
              </Pressable>
            )}

            {session.role === 'patient' && (
              <Text style={styles.patientHint}>本人确认，不用家属签字</Text>
            )}

            {nurseDone ? (
              <View style={styles.doneCard}>
                <Text style={styles.doneTitle}>护士确认完成</Text>
                <Text style={styles.doneSite}>
                  患者选的部位：{selectedLabels.join('\u3001')}
                </Text>
                <Text style={styles.doneTip}>
                  这一例已经确认好了。请再对照纸质文书上的手术部位是否一致。点下方回首页，可开始下一例。
                </Text>
                {syncStatus === 'ok' ? (
                  <Text style={styles.syncOk}>已同步到管理后台</Text>
                ) : null}
                {syncStatus === 'fail' ? (
                  <Text style={styles.syncFail}>后台同步未成功，将在下次打开 App 时自动重试</Text>
                ) : null}
                <Pressable style={styles.nurseBtn} onPress={goHome}>
                  <Text style={styles.nurseBtnText}>返回首页</Text>
                </Pressable>
              </View>
            ) : (
              <>
                {locked ? (
                  <Text style={styles.submittedHint}>
                    部位已锁定。请护士点下方「护士确认」，记录才会传到管理后台。
                  </Text>
                ) : null}

                <View style={styles.actionRow}>
                  <Pressable
                    style={[
                      styles.actionBtn,
                      styles.submitBtn,
                      (locked || !selectedParts.length) && styles.ctaDisabled,
                    ]}
                    disabled={locked || !selectedParts.length}
                    onPress={onSubmitSite}
                  >
                    <Text style={styles.submitBtnText}>
                      {locked ? '已提交' : '提交'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, styles.reselectBtn]}
                    onPress={onReselect}
                  >
                    <Text style={styles.reselectBtnText}>重新选择</Text>
                  </Pressable>
                </View>

                <Pressable
                  style={[
                    styles.nurseBtn,
                    (!selectedParts.length || !locked) && styles.ctaDisabled,
                  ]}
                  onPress={onNurseConfirm}
                >
                  <Text style={styles.nurseBtnText}>护士确认</Text>
                </Pressable>
              </>
            )}
          </View>
        </ScrollView>

          <SignatureSheet
            visible={signOpen}
            title="家属签字"
            signerName=""
            initialPaths={session.familySignaturePaths}
            onCancel={() => setSignOpen(false)}
            onConfirm={(paths) => {
              update({
                familySignaturePaths: paths,
                familySigned: paths.length > 0,
              });
              setSignOpen(false);
            }}
          />

          <Modal visible={zonePicker !== null} transparent animationType="slide">
            <Pressable style={styles.mask} onPress={() => setZonePicker(null)}>
              <Pressable
                style={[
                  styles.sheet,
                  { paddingBottom: Math.max(insets.bottom, 12) + 8 },
                ]}
                onPress={(e) => e.stopPropagation()}
              >
                <Text style={styles.sheetTitle}>
                  请选具体部位 {'\u00b7'}{' '}
                  {zonePicker ? zoneDisplayName(zonePicker.zone) : ''}
                  {zonePicker?.side
                    ? `\uff08${zonePicker.side}\uff09`
                    : ''}
                </Text>
                <Text style={styles.sheetHint}>
                  可多选；再点一下可取消；选好后点「完成」
                </Text>
                <FlatList
                  data={zoneOptions}
                  keyExtractor={(item) => item.id}
                  style={styles.sheetList}
                  renderItem={({ item }) => {
                    const picked = session.selectedPartIds.includes(item.id);
                    return (
                      <Pressable
                        style={[
                          styles.sheetItem,
                          picked && styles.sheetItemPicked,
                        ]}
                        onPress={() => togglePart(item.id)}
                      >
                        <Text
                          style={[
                            styles.sheetItemText,
                            picked && styles.sheetItemTextPicked,
                          ]}
                        >
                          {picked ? '\u2713 ' : ''}
                          {item.label}
                        </Text>
                      </Pressable>
                    );
                  }}
                />
                <Pressable
                  style={styles.sheetDone}
                  onPress={() => setZonePicker(null)}
                >
                  <Text style={styles.sheetDoneText}>{"完成"}</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  root: { flex: 1 },
  pageContent: {
    flexGrow: 1,
    paddingBottom: spacing.sm,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  hint: {
    fontSize: 12,
    color: colors.muted,
    lineHeight: 17,
    paddingHorizontal: spacing.md,
    paddingTop: 6,
    paddingBottom: 4,
  },
  tabs: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.line,
    borderRadius: 10,
    padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: colors.surface },
  tabText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  tabTextActive: { color: colors.primary },
  genderRow: { flexDirection: 'row', gap: 6 },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  genderChipActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  genderText: { fontSize: 13, color: colors.muted, fontWeight: '600' },
  genderTextActive: { color: colors.primary },
  mapBox: {
    marginHorizontal: spacing.md,
    marginTop: 4,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  footer: {
    marginTop: 8,
    paddingHorizontal: spacing.md,
    paddingTop: 10,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  chipScroll: {
    flexGrow: 0,
  },
  chipScrollContent: { flexGrow: 0 },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  resultMain: { flex: 1, minWidth: 0 },
  resultLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  resultLabel: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  clearAll: { fontSize: 12, color: colors.primary, fontWeight: '700' },
  resultPlaceholder: { fontSize: 14, color: colors.muted },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipLocked: { opacity: 0.95 },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: '600' },
  speaker: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  speakerText: { fontSize: 14 },
  signBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: colors.primarySoft,
  },
  signDone: {
    borderColor: colors.success,
    backgroundColor: colors.successSoft,
    borderStyle: 'solid',
  },
  signTitle: {
    textAlign: 'center',
    color: colors.primary,
    fontWeight: '800',
    fontSize: 14,
    marginBottom: 2,
  },
  signText: { textAlign: 'center', color: colors.muted, fontWeight: '600' },
  signDoneLabel: {
    textAlign: 'center',
    color: colors.success,
    fontWeight: '700',
    marginBottom: 6,
    fontSize: 12,
  },
  patientHint: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 11,
    marginBottom: 8,
  },
  submittedHint: {
    textAlign: 'center',
    color: colors.success,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  doneCard: {
    backgroundColor: colors.successSoft,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.success,
    padding: 14,
    marginBottom: 4,
  },
  doneTitle: {
    textAlign: 'center',
    color: colors.success,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 8,
  },
  doneSite: {
    textAlign: 'center',
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
    marginBottom: 8,
  },
  doneTip: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  syncOk: {
    textAlign: 'center',
    color: '#027a48',
    fontSize: 13,
    marginBottom: 10,
  },
  syncFail: {
    textAlign: 'center',
    color: '#b42318',
    fontSize: 13,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtn: { backgroundColor: colors.primary },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  reselectBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  reselectBtnText: { color: colors.ink, fontSize: 16, fontWeight: '700' },
  nurseBtn: {
    backgroundColor: colors.success,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  nurseBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  ctaDisabled: { opacity: 0.4 },
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '55%',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    color: colors.ink,
  },
  sheetHint: {
    fontSize: 12,
    color: colors.muted,
    paddingHorizontal: spacing.md,
    marginTop: 4,
    marginBottom: 8,
  },
  sheetList: { maxHeight: 280 },
  sheetItem: {
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  sheetItemPicked: { backgroundColor: colors.primarySoft },
  sheetItemText: { fontSize: 16, color: colors.ink },
  sheetItemTextPicked: { color: colors.primary, fontWeight: '700' },
  sheetDone: {
    marginHorizontal: spacing.md,
    marginTop: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetDoneText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

