import React, { useMemo, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

/** 统一逻辑画布，签字与回显同一坐标系 */
export const SIGN_W = 360;
export const SIGN_H = 220;

type Point = { x: number; y: number };

type Props = {
  paths: string[];
  onChange: (paths: string[]) => void;
  height?: number;
};

const MIN_DIST = 1.5;
const STROKE = 3;

function pointsToSmoothPath(points: Point[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const p = points[0];
    return `M ${p.x.toFixed(2)} ${p.y.toFixed(2)} l 0.01 0`;
  }
  if (points.length === 2) {
    const [a, b] = points;
    return `M ${a.x.toFixed(2)} ${a.y.toFixed(2)} L ${b.x.toFixed(2)} ${b.y.toFixed(2)}`;
  }

  let d = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
  for (let i = 1; i < points.length - 1; i += 1) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    d += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }
  const last = points[points.length - 1];
  d += ` L ${last.x.toFixed(2)} ${last.y.toFixed(2)}`;
  return d;
}

function dist(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function StrokePath({ d }: { d: string }) {
  return (
    <Path
      d={d}
      stroke={colors.ink}
      strokeWidth={STROKE}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

/** 手写签字板：坐标归一化到 SIGN_W × SIGN_H，保证回显一致 */
export function SignaturePad({ paths, onChange, height = 200 }: Props) {
  const [box, setBox] = useState({ width: 1, height });
  const [livePath, setLivePath] = useState('');
  const current = useRef<Point[]>([]);
  const committed = useRef(paths);
  committed.current = paths;
  const boxRef = useRef(box);
  boxRef.current = box;

  const toLogical = (locationX: number, locationY: number): Point => {
    const { width, height: h } = boxRef.current;
    return {
      x: (locationX / Math.max(width, 1)) * SIGN_W,
      y: (locationY / Math.max(h, 1)) * SIGN_H,
    };
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onStartShouldSetPanResponderCapture: () => true,
        onMoveShouldSetPanResponderCapture: () => true,
        onPanResponderTerminationRequest: () => false,
        onShouldBlockNativeResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          current.current = [toLogical(locationX, locationY)];
          setLivePath(pointsToSmoothPath(current.current));
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const next = toLogical(locationX, locationY);
          const prev = current.current[current.current.length - 1];
          if (!prev || dist(prev, next) >= MIN_DIST) {
            current.current = [...current.current, next];
            setLivePath(pointsToSmoothPath(current.current));
          }
        },
        onPanResponderRelease: () => {
          const draft = pointsToSmoothPath(current.current);
          // 至少落下一笔（含点按），避免安卓采样少导致整笔丢弃
          if (draft && current.current.length >= 1) {
            onChange([...committed.current, draft]);
          }
          current.current = [];
          setLivePath('');
        },
        onPanResponderTerminate: () => {
          const draft = pointsToSmoothPath(current.current);
          if (draft && current.current.length >= 1) {
            onChange([...committed.current, draft]);
          }
          current.current = [];
          setLivePath('');
        },
      }),
    [onChange],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height: h } = e.nativeEvent.layout;
    setBox({ width, height: h });
  };

  return (
    <View
      collapsable={false}
      style={
        [
          styles.pad,
          { height },
          Platform.OS === 'web'
            ? ({ touchAction: 'none', userSelect: 'none', cursor: 'crosshair' } as object)
            : null,
        ] as object
      }
      onLayout={onLayout}
      {...pan.panHandlers}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${SIGN_W} ${SIGN_H}`}
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        {paths.map((d, i) => (
          <StrokePath key={`c-${i}`} d={d} />
        ))}
        {livePath ? <StrokePath d={livePath} /> : null}
      </Svg>
    </View>
  );
}

export function SignaturePreview({
  paths,
  height = 72,
}: {
  paths: string[];
  height?: number;
}) {
  if (!paths.length) return null;
  return (
    <View style={[styles.preview, { height }]}>
      <Svg
        width="100%"
        height={height}
        viewBox={`0 0 ${SIGN_W} ${SIGN_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {paths.map((d, i) => (
          <StrokePath key={i} d={d} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
    // 保证手势优先落在签字区，不被父滚动抢走
    ...(Platform.OS !== 'web' ? { zIndex: 2 } : null),
  },
  preview: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
  },
});
