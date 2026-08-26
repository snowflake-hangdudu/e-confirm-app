import type { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import {
  FEMALE_FRONT_MUSCLE_PATHS,
  MALE_FRONT_MUSCLE_PATHS,
  LibPaths,
} from './frontMusclePaths';
import { getPartById } from './bodyRegions';
import { svgSideFromAnatomical } from './bodyHighlighterMap';
import { BodyView } from '../types';

/**
 * 人体图精细高亮适配层。
 * 定稿方法（库肌肉子路径手动分割）见：docs/body-map-highlight.md
 * 后续优化必须按该文档，禁止改回手绘蒙版 / Mask 裁切主路径。
 */

/** 与人体库 Svg 一致（男女 viewBox 不同，必须分开） */
export const LIB_VB = {
  male: { minX: 0, minY: 0, w: 724, h: 1448 },
  female: { minX: -50, minY: -40, w: 734, h: 1538 },
} as const;

export function libViewBoxAttr(gender: 'male' | 'female'): string {
  const v = LIB_VB[gender];
  return `${v.minX} ${v.minY} ${v.w} ${v.h}`;
}

type MuscleName = 'abs' | 'obliques' | 'chest' | 'head' | 'neck';

/** 蒙版用有机轮廓（非矩形），裁出精细区且贴合躯干 */
export type SoftMask = {
  /** SVG path，白色可见区 */
  d: string;
};

type ClipAdapt = {
  kind: 'clip';
  muscles: MuscleName[];
  mask: SoftMask;
  /** 女体专用蒙版（男/女库坐标不同时必填） */
  maskFemale?: SoftMask;
  /** 只取库路径的左/右（与 Body 的 left/right 一致：画面左右） */
  pathSide?: 'left' | 'right' | 'both';
  /** 不使用 Mask，直接画 pathSide 对应路径 */
  noMask?: boolean;
  /**
   * 库肌肉在正中有缝（如胸大肌左右分离）时，直接填蒙版轮廓，
   * 避免「胸骨正中」只露出半边。
   */
  fillMask?: boolean;
};

/** 腹部：直接选用库肌肉子路径高亮（无 Mask，彻底避免错位） */
type PathsAdapt = {
  kind: 'paths';
  resolve: (gender: 'male' | 'female') => string[];
};

type MuscleAdapt = {
  kind: 'muscle';
  slug: Slug;
  side?: 'left' | 'right';
};

export type PartAdapt = ClipAdapt | PathsAdapt | MuscleAdapt;

function pathAnchorY(d: string): number {
  const m = d.match(/^[Mm]\s*(-?[\d.]+)[, ]\s*(-?[\d.]+)/);
  return m ? Number(m[2]) : 9999;
}

type YBand = 'upper' | 'mid' | 'lower';

/** 男腹：按路径起点 Y 分带 */
function yBandMale(y: number): YBand {
  if (y < 510) return 'upper';
  if (y < 580) return 'mid';
  return 'lower';
}

/**
 * female-iter-1：女腹肌块少且左下无独立 lower 锚点；
 * 按子路径序号标定（与 frontMusclePaths 数组顺序一致），避免纯 Y 把长条 mid 误判。
 */
const FEMALE_ABS_BANDS: { left: YBand[]; right: YBand[] } = {
  left: ['upper', 'lower', 'upper', 'mid'],
  right: ['mid', 'upper', 'lower', 'upper'],
};
const FEMALE_OBL_BANDS: { left: YBand[]; right: YBand[] } = {
  left: ['upper', 'upper', 'upper', 'upper', 'lower', 'upper'],
  right: ['upper', 'upper', 'lower', 'upper', 'upper', 'upper'],
};

function pickBandPaths(
  gender: 'male' | 'female',
  muscle: 'abs' | 'obliques',
  svgSide: 'left' | 'right' | 'both',
  bands: YBand[],
): string[] {
  const table =
    gender === 'female' ? FEMALE_FRONT_MUSCLE_PATHS : MALE_FRONT_MUSCLE_PATHS;
  const block = table[muscle];
  if (!block) return [];

  const take = (side: 'left' | 'right') => {
    const paths = block[side];
    if (gender === 'female') {
      const map =
        muscle === 'abs' ? FEMALE_ABS_BANDS[side] : FEMALE_OBL_BANDS[side];
      return paths.filter((_, i) => bands.includes(map[i] ?? 'mid'));
    }
    return paths.filter((d) => bands.includes(yBandMale(pathAnchorY(d))));
  };

  if (svgSide === 'both') return [...take('left'), ...take('right')];
  return take(svgSide);
}

/**
 * 腹部：按库肌肉子路径选区（画面左=患者右）。
 * 不用 Mask/手绘坐标，与 Body 底图 100% 同源对齐。
 */
const FRONT_ABD_PATHS: Record<string, PathsAdapt> = {
  'f-abd-ru': {
    kind: 'paths',
    resolve: (g) => [
      ...pickBandPaths(g, 'abs', 'left', ['upper']),
      ...pickBandPaths(g, 'obliques', 'left', ['upper']),
    ],
  },
  'f-abd-u': {
    kind: 'paths',
    resolve: (g) => pickBandPaths(g, 'abs', 'both', ['upper']),
  },
  'f-abd-lu': {
    kind: 'paths',
    resolve: (g) => [
      ...pickBandPaths(g, 'abs', 'right', ['upper']),
      ...pickBandPaths(g, 'obliques', 'right', ['upper']),
    ],
  },
  'f-abd-umb': {
    kind: 'paths',
    resolve: (g) => pickBandPaths(g, 'abs', 'both', ['mid']),
  },
  'f-abd-rl': {
    kind: 'paths',
    resolve: (g) => [
      ...pickBandPaths(g, 'abs', 'left', ['mid', 'lower']),
      ...pickBandPaths(g, 'obliques', 'left', ['mid', 'lower']),
    ],
  },
  'f-abd-l': {
    kind: 'paths',
    resolve: (g) => pickBandPaths(g, 'abs', 'both', ['lower']),
  },
  'f-abd-ll': {
    kind: 'paths',
    resolve: (g) => [
      ...pickBandPaths(g, 'abs', 'right', ['mid', 'lower']),
      ...pickBandPaths(g, 'obliques', 'right', ['mid', 'lower']),
    ],
  },
};

/**
 * 胸部：男/女分别取对应库 chest 子路径（与腹部同法，禁止女体套男蒙版）
 * 画面左 = 患者右 → 右胸/右乳用 left 路径
 */
/**
 * 胸骨正中带：按当前性别 viewBox 中心生成，避免女体误用男坐标中心(362)
 * 女 viewBox 中心 x≈317；男≈362
 */
function sternumPath(gender: 'male' | 'female'): string {
  const vb = LIB_VB[gender];
  if (gender === 'female') {
    // female-iter-3：中线取双乳缝视觉中心（略大于 viewBox 几何中心 317）
    const cx = 330;
    const top = 322;
    const bot = 402;
    const w = 8;
    return `M${cx - w} ${top} C${cx - w / 2} ${top - 5} ${cx + w / 2} ${top - 5} ${cx + w} ${top + 2} C${cx + w + 1} ${(top + bot) / 2} ${cx + w + 1} ${bot - 12} ${cx + w - 1.5} ${bot} C${cx} ${bot + 3} ${cx} ${bot + 3} ${cx - w + 1.5} ${bot} C${cx - w - 1} ${bot - 12} ${cx - w - 1} ${(top + bot) / 2} ${cx - w} ${top} Z`;
  }
  const cx = vb.minX + vb.w / 2;
  const top = 318;
  const bot = 442;
  const w = 22;
  return `M${cx - w} ${top} C${cx - 10} ${top - 6} ${cx + 10} ${top - 6} ${cx + w} ${top} C${cx + w + 4} ${(top + bot) / 2} ${cx + w + 4} ${bot - 20} ${cx + w - 4} ${bot} C${cx} ${bot + 10} ${cx} ${bot + 10} ${cx - w + 4} ${bot} C${cx - w - 4} ${bot - 20} ${cx - w - 4} ${(top + bot) / 2} ${cx - w} ${top} Z`;
}

/**
 * 胸左/右、乳：直接走库 Body data 原生高亮（男/女库各自路径，对齐 100%）
 * 胸骨正中：库无独立 slug，按性别 viewBox 中心生成正中带
 */
const FRONT_CHEST_MUSCLE: Record<string, MuscleAdapt> = {
  'f-chest-r': { kind: 'muscle', slug: 'chest', side: 'left' },
  'f-chest-l': { kind: 'muscle', slug: 'chest', side: 'right' },
  'f-breast-r': { kind: 'muscle', slug: 'chest', side: 'left' },
  'f-breast-l': { kind: 'muscle', slug: 'chest', side: 'right' },
};

const FRONT_CHEST_PATHS: Record<string, PathsAdapt> = {
  'f-sternum': {
    kind: 'paths',
    resolve: (g) => [sternumPath(g)],
  },
};

/**
 * 头/颈等：男可用 Mask；女体用 maskFemale（female-iter-2，禁止套男坐标）
 * 颈：优先库子路径直绘（female-iter-2 / 男女通用）
 */
const FRONT_NECK_PATHS: Record<string, PathsAdapt> = {
  'f-neck-front': {
    kind: 'paths',
    resolve: (g) => {
      const t = g === 'female' ? FEMALE_FRONT_MUSCLE_PATHS : MALE_FRONT_MUSCLE_PATHS;
      return [...(t.neck?.common ?? [])];
    },
  },
  'f-neck-r': {
    kind: 'paths',
    resolve: (g) => {
      const t = g === 'female' ? FEMALE_FRONT_MUSCLE_PATHS : MALE_FRONT_MUSCLE_PATHS;
      return [...(t.neck?.left ?? [])];
    },
  },
  'f-neck-l': {
    kind: 'paths',
    resolve: (g) => {
      const t = g === 'female' ? FEMALE_FRONT_MUSCLE_PATHS : MALE_FRONT_MUSCLE_PATHS;
      return [...(t.neck?.right ?? [])];
    },
  },
};

/** 整头：库原生高亮，对齐最稳 */
const FRONT_HEAD_MUSCLE: Record<string, MuscleAdapt> = {
  'f-head': { kind: 'muscle', slug: 'head' },
};

const FRONT_CLIP: Record<string, ClipAdapt> = {
  'f-forehead': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M325 150 C350 140 374 140 399 150 C398 175 370 182 362 182 C354 182 326 175 325 150 Z' },
    maskFemale: {
      d: 'M305 102 C325 90 348 90 365 102 C363 122 348 130 335 130 C322 130 307 122 305 102 Z',
    },
  },
  'f-eye-r': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M320 185 C332 178 348 178 356 188 C348 198 332 198 320 190 Z' },
    maskFemale: {
      // female-iter-3：避开发髻，落在面部下半偏左眼眶
      d: 'M302 158 C314 150 326 152 332 162 C326 172 314 172 302 166 Z',
    },
  },
  'f-eye-l': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M368 185 C380 178 396 178 404 188 C396 198 380 198 368 190 Z' },
    maskFemale: {
      d: 'M338 158 C350 150 362 152 368 162 C362 172 350 172 338 166 Z',
    },
  },
  'f-ear-r': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M300 188 C308 185 314 195 314 210 C312 225 304 230 298 220 C294 208 296 195 300 188 Z' },
    maskFemale: {
      d: 'M278 155 C288 148 296 162 294 182 C290 198 282 200 276 188 C272 172 274 160 278 155 Z',
    },
  },
  'f-ear-l': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M424 188 C416 185 410 195 410 210 C412 225 420 230 426 220 C430 208 428 195 424 188 Z' },
    maskFemale: {
      d: 'M390 155 C380 148 372 162 374 182 C378 198 386 200 392 188 C396 172 394 160 390 155 Z',
    },
  },
  'f-nose': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M352 198 C360 196 368 196 372 200 C372 220 368 235 362 238 C356 235 352 220 352 198 Z' },
    maskFemale: {
      d: 'M326 162 C334 158 344 158 348 164 C348 182 342 196 335 200 C328 196 326 182 326 162 Z',
    },
  },
  'f-face-r': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M312 200 C330 195 348 205 350 230 C340 250 320 255 310 240 C305 225 308 208 312 200 Z' },
    maskFemale: {
      d: 'M292 160 C312 152 326 165 328 188 C318 208 298 212 288 192 C284 175 286 165 292 160 Z',
    },
  },
  'f-face-l': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M412 200 C394 195 376 205 374 230 C384 250 404 255 414 240 C419 225 416 208 412 200 Z' },
    maskFemale: {
      d: 'M376 160 C356 152 342 165 340 188 C350 208 370 212 380 192 C384 175 382 165 376 160 Z',
    },
  },
  'f-lip': {
    kind: 'clip',
    muscles: ['head'],
    mask: { d: 'M340 238 C352 232 372 232 384 238 C372 250 352 250 340 238 Z' },
    maskFemale: {
      d: 'M318 188 C330 180 348 180 360 188 C348 200 330 200 318 188 Z',
    },
  },
};

function limbAdapt(partId: string): MuscleAdapt | null {
  const part = getPartById(partId);
  if (!part || part.view !== 'front') return null;
  if (part.zone === '腹部' || part.zone === '胸部' || part.zone === '头面部') {
    return null;
  }

  const anat: '左' | '右' | undefined = part.label.includes('左')
    ? '左'
    : part.label.includes('右')
      ? '右'
      : undefined;
  const side = svgSideFromAnatomical('front', anat);

  let slug: Slug = 'quadriceps';
  if (part.label.includes('手')) slug = 'hands';
  else if (part.label.includes('前臂')) slug = 'forearm';
  else if (part.label.includes('肘') || part.label.includes('上臂')) slug = 'biceps';
  else if (part.label.includes('肩')) slug = 'deltoids';
  else if (part.label.includes('足')) slug = 'feet';
  else if (part.label.includes('踝')) slug = 'ankles';
  else if (part.label.includes('膝')) slug = 'knees';
  else if (part.label.includes('小腿')) slug = 'tibialis';
  else if (part.label.includes('髋')) slug = 'adductors';
  else if (part.label.includes('大腿')) slug = 'quadriceps';
  else return null;

  return { kind: 'muscle', slug, side };
}

export function getPartAdapt(partId: string): PartAdapt | null {
  if (FRONT_ABD_PATHS[partId]) return FRONT_ABD_PATHS[partId];
  if (FRONT_CHEST_MUSCLE[partId]) return FRONT_CHEST_MUSCLE[partId];
  if (FRONT_CHEST_PATHS[partId]) return FRONT_CHEST_PATHS[partId];
  if (FRONT_HEAD_MUSCLE[partId]) return FRONT_HEAD_MUSCLE[partId];
  if (FRONT_NECK_PATHS[partId]) return FRONT_NECK_PATHS[partId];
  if (FRONT_CLIP[partId]) return FRONT_CLIP[partId];
  return limbAdapt(partId);
}

function collectPaths(
  muscles: MuscleName[],
  gender: 'male' | 'female',
  pathSide: 'left' | 'right' | 'both' = 'both',
): string[] {
  const table =
    gender === 'female' ? FEMALE_FRONT_MUSCLE_PATHS : MALE_FRONT_MUSCLE_PATHS;
  const out: string[] = [];
  for (const m of muscles) {
    const p: LibPaths | undefined = table[m];
    if (!p) continue;
    out.push(...p.common);
    if (pathSide === 'both' || pathSide === 'left') out.push(...p.left);
    if (pathSide === 'both' || pathSide === 'right') out.push(...p.right);
  }
  return out;
}

export type ClipRender = {
  partId: string;
  paths: string[];
  /** 有蒙版则裁切；fillMask 则直接画蒙版；都无则直接画 paths（腹部） */
  mask?: SoftMask;
  fillMask?: boolean;
};

/**
 * 细分用语「凑满」某一库肌肉时：直接用库原生红填，不再叠曲线蒙版矢量。
 * 例：腹部 7 项全选 → abs + obliques；头面部五官全选 → head。
 */
const FRONT_FULL_LIB_GROUPS: { ids: readonly string[]; slugs: readonly Slug[] }[] =
  [
    {
      ids: [
        'f-abd-ru',
        'f-abd-u',
        'f-abd-lu',
        'f-abd-umb',
        'f-abd-rl',
        'f-abd-l',
        'f-abd-ll',
      ],
      slugs: ['abs', 'obliques'],
    },
    {
      ids: [
        'f-chest-l',
        'f-chest-r',
        'f-sternum',
        'f-breast-l',
        'f-breast-r',
      ],
      slugs: ['chest'],
    },
    {
      ids: [
        'f-head',
        'f-forehead',
        'f-eye-l',
        'f-eye-r',
        'f-ear-l',
        'f-ear-r',
        'f-nose',
        'f-face-l',
        'f-face-r',
        'f-lip',
      ],
      slugs: ['head'],
    },
    {
      ids: ['f-neck-front', 'f-neck-l', 'f-neck-r'],
      slugs: ['neck'],
    },
  ];

/** 胸部左右用语凑满时，只红一侧库肌肉 */
const FRONT_CHEST_SIDE_GROUPS: {
  ids: readonly string[];
  anatomical: '左' | '右';
}[] = [
  { ids: ['f-chest-l', 'f-breast-l'], anatomical: '左' },
  { ids: ['f-chest-r', 'f-breast-r'], anatomical: '右' },
];

function pushLibFill(
  bodyData: ExtendedBodyPart[],
  slug: Slug,
  side?: 'left' | 'right',
) {
  bodyData.push({
    slug,
    side,
    styles: { fill: '#E74C3C' },
  });
}

function mergeBodyData(items: ExtendedBodyPart[]): ExtendedBodyPart[] {
  const map = new Map<
    string,
    { slug: Slug; left: boolean; right: boolean; both: boolean }
  >();
  for (const item of items) {
    if (!item.slug) continue;
    const key = item.slug;
    const cur = map.get(key) ?? {
      slug: item.slug,
      left: false,
      right: false,
      both: false,
    };
    if (!item.side) cur.both = true;
    else if (item.side === 'left') cur.left = true;
    else cur.right = true;
    map.set(key, cur);
  }
  const out: ExtendedBodyPart[] = [];
  map.forEach((v) => {
    if (v.both || (v.left && v.right)) {
      out.push({ slug: v.slug, styles: { fill: '#E74C3C' } });
    } else if (v.left) {
      out.push({ slug: v.slug, side: 'left', styles: { fill: '#E74C3C' } });
    } else if (v.right) {
      out.push({ slug: v.slug, side: 'right', styles: { fill: '#E74C3C' } });
    }
  });
  return out;
}

export function buildAdaptation(
  partIds: string[],
  view: BodyView,
  gender: 'male' | 'female',
): { bodyData: ExtendedBodyPart[]; clips: ClipRender[] } {
  const bodyData: ExtendedBodyPart[] = [];
  const clips: ClipRender[] = [];

  if (view !== 'front') {
    for (const id of partIds) {
      const part = getPartById(id);
      if (!part) continue;
      const anat: '左' | '右' | undefined = part.label.includes('左')
        ? '左'
        : part.label.includes('右')
          ? '右'
          : undefined;
      const side = svgSideFromAnatomical('back', anat);
      let slug: Slug = 'upper-back';
      if (part.label.includes('枕')) slug = 'head';
      else if (part.label.includes('颈')) slug = 'neck';
      else if (part.label.includes('肩背')) slug = 'deltoids';
      else if (part.label.includes('胸椎') || part.label.includes('正中'))
        slug = 'upper-back';
      else if (part.label.includes('骶')) slug = 'gluteal';
      else if (part.label.includes('腰')) slug = 'lower-back';
      else if (part.label.includes('腘') || part.label.includes('大腿'))
        slug = 'hamstring';
      else if (part.label.includes('小腿')) slug = 'calves';
      pushLibFill(bodyData, slug, side);
    }
    return { bodyData: mergeBodyData(bodyData), clips };
  }

  const selected = new Set(partIds);
  /** 已由库原生整块/半块覆盖的部位 id，不再画蒙版矢量 */
  const coveredByLib = new Set<string>();

  for (const group of FRONT_FULL_LIB_GROUPS) {
    if (group.ids.every((id) => selected.has(id))) {
      for (const slug of group.slugs) pushLibFill(bodyData, slug);
      group.ids.forEach((id) => coveredByLib.add(id));
    }
  }

  // 胸部未整区全选时：左右用语各自凑满 → 库 chest 单侧红
  for (const g of FRONT_CHEST_SIDE_GROUPS) {
    if (g.ids.every((id) => selected.has(id) && !coveredByLib.has(id))) {
      pushLibFill(
        bodyData,
        'chest',
        svgSideFromAnatomical('front', g.anatomical),
      );
      g.ids.forEach((id) => coveredByLib.add(id));
    }
  }

  for (const id of partIds) {
    if (coveredByLib.has(id)) continue;
    const adapt = getPartAdapt(id);
    if (!adapt) continue;
    if (adapt.kind === 'muscle') {
      pushLibFill(bodyData, adapt.slug, adapt.side);
    } else if (adapt.kind === 'paths') {
      clips.push({ partId: id, paths: adapt.resolve(gender) });
    } else if (adapt.fillMask) {
      const mask =
        gender === 'female' && adapt.maskFemale
          ? adapt.maskFemale
          : adapt.mask;
      clips.push({
        partId: id,
        paths: [],
        mask,
        fillMask: true,
      });
    } else if (adapt.noMask || adapt.pathSide) {
      const side = adapt.pathSide ?? 'both';
      const paths = collectPaths(adapt.muscles, gender, side);
      if (adapt.noMask || !adapt.mask?.d || gender === 'female') {
        clips.push({ partId: id, paths });
      } else {
        clips.push({ partId: id, paths, mask: adapt.mask });
      }
    } else {
      // 头面细分：男用 mask；女用 maskFemale（female-iter-2）
      const paths = collectPaths(adapt.muscles, gender, 'both');
      const mask =
        gender === 'female'
          ? adapt.maskFemale ?? adapt.mask
          : adapt.mask;
      if (gender === 'female' && !adapt.maskFemale) {
        // 无女蒙版时不套男坐标，整块库路径兜底
        clips.push({ partId: id, paths });
      } else {
        clips.push({ partId: id, paths, mask });
      }
    }
  }
  return { bodyData: mergeBodyData(bodyData), clips };
}
