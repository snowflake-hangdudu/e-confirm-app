import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import Svg, { Path, Defs, Mask, Rect, G } from 'react-native-svg';
import Body, { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { BodyView } from '../types';
import { getPartById } from '../data/bodyRegions';
import {
  HighlighterPick,
  mapHighlighterToPick,
} from '../data/bodyHighlighterMap';
import { libViewBoxAttr, buildAdaptation, ClipRender, LIB_VB } from '../data/surgicalAdaptation';
import { colors } from '../theme';
import { showAlert } from '../utils/showAlert';

type Gender = 'male' | 'female';

type Props = {
  view: BodyView;
  gender?: Gender;
  selectedPartIds: string[];
  onPick: (pick: HighlighterPick) => void;
};

const TIP_H = 36;
const SIDE_LABEL_W = 26;
/** 仅兜底，实际由容器撑满；平板大图区可到 2.4 */
const MAX_SCALE = 2.4;

/**
 * 精细高亮：与 Body 同性别 viewBox、同像素尺寸，路径与库同源 → 天然对齐
 */
function FineHighlights({
  clips,
  scale,
  gender,
}: {
  clips: ClipRender[];
  scale: number;
  gender: Gender;
}) {
  const w = 200 * scale;
  const h = 400 * scale;
  const vb = LIB_VB[gender];
  return (
    <Svg
      width={w}
      height={h}
      viewBox={libViewBoxAttr(gender)}
      preserveAspectRatio="xMidYMid meet"
      style={styles.overlay}
      pointerEvents="none"
    >
      <Defs>
        {clips
          .filter((c) => c.mask && !c.fillMask)
          .map((c) => (
            <Mask
              key={`m-${c.partId}`}
              id={`fine-mask-${c.partId}`}
              x={vb.minX}
              y={vb.minY}
              width={vb.w}
              height={vb.h}
              maskUnits="userSpaceOnUse"
            >
              <Rect
                x={vb.minX}
                y={vb.minY}
                width={vb.w}
                height={vb.h}
                fill="#000"
              />
              <Path d={c.mask!.d} fill="#fff" />
            </Mask>
          ))}
      </Defs>
      {clips.map((c) => {
        if (c.fillMask && c.mask) {
          return (
            <Path
              key={c.partId}
              d={c.mask.d}
              fill="rgba(231,76,60,0.86)"
              stroke="rgba(192,57,43,0.4)"
              strokeWidth={0.8}
            />
          );
        }
        const paths = c.paths.map((d, i) => (
          <Path
            key={`${c.partId}-${i}`}
            d={d}
            fill="rgba(231,76,60,0.9)"
            stroke="rgba(192,57,43,0.25)"
            strokeWidth={0.6}
          />
        ));
        if (c.mask && !c.fillMask) {
          return (
            <G key={c.partId} mask={`url(#fine-mask-${c.partId})`}>
              {paths}
            </G>
          );
        }
        return <G key={c.partId}>{paths}</G>;
      })}
    </Svg>
  );
}

/**
 * 定稿方案：高清人体库底图 + 二级用语列表；
 * 腹/胸/头等细分用库肌肉 Path + 曲线蒙版高亮（文书以用语为准）。
 */
export function BodyMap({
  view,
  gender = 'male',
  selectedPartIds,
  onPick,
}: Props) {
  const [box, setBox] = useState({ w: 0, h: 0 });

  const { bodyData, clips } = useMemo(
    () => buildAdaptation(selectedPartIds, view, gender),
    [selectedPartIds, view, gender],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== box.w || height !== box.h) setBox({ w: width, h: height });
  };

  const scale =
    box.w > 0 && box.h > TIP_H
      ? Math.min(
          (box.w - SIDE_LABEL_W * 2) / 200,
          (box.h - TIP_H) / 400,
          MAX_SCALE,
        ) * 0.98
      : 1.2;
  const bodyW = 200 * scale;
  const bodyH = 400 * scale;
  /** 正视图与患者相对：画面左=患者右；后视图与患者同向 */
  const leftSideLabel = view === 'front' ? '右' : '左';
  const rightSideLabel = view === 'front' ? '左' : '右';

  const onBodyPress = (part: ExtendedBodyPart, side?: 'left' | 'right') => {
    if (!part.slug) return;
    const pick = mapHighlighterToPick(view, part.slug as Slug, side);
    if (!pick) {
      showAlert(
        '这里暂时选不了手术部位',
        view === 'back'
          ? '背面没有胳膊等选项，请改点身子或腿，或切到正面'
          : '请点头颈、胸腹或四肢这些区域',
      );
      return;
    }
    // 腹部始终出全表
    if (pick.zone === '腹部') {
      onPick({ ...pick, side: undefined, slug: 'custom' as Slug });
      return;
    }
    onPick(pick);
  };

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      {box.w > 0 && (
        <>
          <View style={styles.figureRow}>
            <Text style={styles.sideLabel} pointerEvents="none">
              {leftSideLabel}
            </Text>
            <View style={[styles.figure, { width: bodyW, height: bodyH }]}>
              <Body
                data={bodyData}
                gender={gender}
                side={view}
                scale={scale}
                border="#B8B8B8"
                defaultFill="#3f3f3f"
                onBodyPartPress={onBodyPress}
              />
              {clips.length > 0 && view === 'front' && (
                <FineHighlights clips={clips} scale={scale} gender={gender} />
              )}
            </View>
            <Text style={styles.sideLabel} pointerEvents="none">
              {rightSideLabel}
            </Text>
          </View>
          <Text style={styles.tip} pointerEvents="none">
            示意图 · 左右为患者自身 · 点选部位 · 以文书为准
          </Text>
        </>
      )}
    </View>
  );
}

export function BodyMapPreview({
  view,
  gender = 'male',
  selectedPartIds,
  compact,
}: {
  view: BodyView;
  gender?: Gender;
  selectedPartIds: string[];
  compact?: boolean;
}) {
  const { bodyData, clips } = useMemo(
    () => buildAdaptation(selectedPartIds, view, gender),
    [selectedPartIds, view, gender],
  );
  const scale = compact ? 0.85 : 1.05;
  const bodyW = 200 * scale;
  const bodyH = 400 * scale;
  const labels = selectedPartIds
    .map((id) => getPartById(id)?.label)
    .filter(Boolean)
    .join('、');

  return (
    <View style={[styles.previewWrap, compact && styles.previewCompact]}>
      <View style={[styles.figure, { width: bodyW, height: bodyH }]}>
        <Body
          data={bodyData}
          gender={gender}
          side={view}
          scale={scale}
          border="#B8B8B8"
          defaultFill="#3f3f3f"
        />
        {clips.length > 0 && view === 'front' && (
          <FineHighlights clips={clips} scale={scale} gender={gender} />
        )}
        <View style={styles.badge}>
          <View style={styles.dot} />
          <Text style={styles.badgeText}>已指认</Text>
        </View>
      </View>
      {!!labels && <Text style={styles.previewLabel}>{labels}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  figureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideLabel: {
    width: SIDE_LABEL_W,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    lineHeight: 22,
  },
  figure: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  tip: {
    marginTop: 4,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
  },
  previewWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  previewCompact: { paddingVertical: 8 },
  previewLabel: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: -4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hotspotActive,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.hotspotActive,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.hotspotActive,
  },
});
