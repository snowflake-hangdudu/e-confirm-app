import type { ExtendedBodyPart, Slug } from 'react-native-body-highlighter';
import { BodyPart, BodyView } from '../types';
import { BODY_PARTS, getPartById, partsByZone } from './bodyRegions';

export type HighlighterSide = 'left' | 'right';

/** 点选肌肉分区 → 打开手术部位细分列表 */
export type HighlighterPick = {
  zone: string;
  side?: '左' | '右';
  view: BodyView;
  /** 高亮用 slug */
  slug: Slug;
  highlighterSide?: HighlighterSide;
};

/**
 * 库的 left/right = SVG 画面左右。
 * 正视面对面：画面左 = 患者解剖右；后视：画面左 = 患者左。
 */
export function anatomicalFromSvg(
  view: BodyView,
  side?: HighlighterSide,
): '左' | '右' | undefined {
  if (!side) return undefined;
  if (view === 'back') return side === 'left' ? '左' : '右';
  return side === 'left' ? '右' : '左';
}

export function svgSideFromAnatomical(
  view: BodyView,
  anatomical?: '左' | '右',
): HighlighterSide | undefined {
  if (!anatomical) return undefined;
  if (view === 'back') return anatomical === '左' ? 'left' : 'right';
  return anatomical === '左' ? 'right' : 'left';
}

function hasAny(label: string, keys: string[]): boolean {
  return keys.some((k) => label.includes(k));
}

/**
 * 将 body-highlighter 的 slug 映射到手术部位字典分区
 *（先点肌肉块，再只列出该块对应的医学用语）
 */
export function mapHighlighterToPick(
  view: BodyView,
  slug: Slug,
  side?: HighlighterSide,
): HighlighterPick | null {
  // 点选用解剖左右（正视已镜像）
  const cn = anatomicalFromSvg(view, side);

  if (view === 'front') {
    switch (slug) {
      case 'head':
      case 'hair':
        return { zone: '头面部', view, slug, highlighterSide: side };
      case 'neck':
        return { zone: '头面部', view, slug, highlighterSide: side };
      case 'chest':
        return { zone: '胸部', side: cn, view, slug, highlighterSide: side };
      case 'abs':
      case 'obliques':
        return {
          zone: '腹部',
          // 腹库只有整块/侧腹，列表始终给全套九分腹，由用户点精确用语
          side: undefined,
          view,
          slug,
          highlighterSide: side,
        };
      case 'trapezius':
        // 正视斜方肌靠近肩颈，归入上肢「肩」用语
        return { zone: '上肢', side: cn, view, slug, highlighterSide: side };
      case 'deltoids':
      case 'biceps':
      case 'triceps':
      case 'forearm':
      case 'hands':
        return { zone: '上肢', side: cn, view, slug, highlighterSide: side };
      case 'quadriceps':
      case 'knees':
      case 'tibialis':
      case 'calves':
      case 'ankles':
      case 'feet':
      case 'adductors':
        return { zone: '下肢', side: cn, view, slug, highlighterSide: side };
      default:
        return null;
    }
  }

  // back —— 文档后视图为单列，统一 zone「后视图」
  switch (slug) {
    case 'head':
    case 'hair':
    case 'neck':
    case 'trapezius':
    case 'upper-back':
    case 'deltoids':
    case 'lower-back':
    case 'gluteal':
    case 'hamstring':
    case 'calves':
    case 'adductors':
    case 'feet':
      return {
        zone: '后视图',
        side: cn,
        view,
        slug,
        highlighterSide: side,
      };
    case 'triceps':
    case 'forearm':
    case 'hands':
    case 'ankles':
      // 《手术部位》后视单列无上肢/踝用语
      return null;
    default:
      if ((slug as string) === 'abductors') {
        return {
          zone: '后视图',
          side: cn,
          view,
          slug,
          highlighterSide: side,
        };
      }
      return null;
  }
}

/** 按点击的肌肉 slug，只保留真正相关的手术用语 */
function filterBySlug(
  list: BodyPart[],
  view: BodyView,
  slug: Slug,
): BodyPart[] {
  const match = (keys: string[]) =>
    list.filter((p) => hasAny(p.label, keys));

  if (view === 'front') {
    switch (slug) {
      case 'head':
      case 'hair':
      case 'neck':
        return list;
      case 'chest':
        return match(['胸', '乳', '胸骨']);
      case 'abs':
      case 'obliques':
        // 库无九分腹，列出文档全部腹部用语
        return list;
      case 'trapezius':
      case 'deltoids':
        return match(['肩']);
      case 'biceps':
      case 'triceps':
        return match(['上臂', '肘']);
      case 'forearm':
        return match(['前臂']);
      case 'hands':
        return match(['手']);
      case 'adductors':
        return match(['髋']);
      case 'quadriceps':
        return match(['大腿']);
      case 'knees':
        return match(['膝']);
      case 'tibialis':
      case 'calves':
        return match(['小腿']);
      case 'ankles':
        return match(['踝']);
      case 'feet':
        return match(['足', '踝']);
      default:
        return list;
    }
  }

  // 后视图单列，按肌肉块筛文档用语
  switch (slug) {
    case 'head':
    case 'hair':
      return match(['枕']);
    case 'neck':
      return match(['颈']);
    case 'deltoids':
      return match(['肩背']);
    case 'trapezius':
    case 'upper-back':
      return list.filter(
        (p) =>
          p.label.includes('肩背') ||
          p.label.includes('正中') ||
          p.label.includes('胸椎'),
      );
    case 'lower-back':
      return match(['腰臀', '腰椎']);
    case 'gluteal':
      return match(['骶', '腰臀']);
    case 'hamstring':
      return match(['大腿后', '腘']);
    case 'calves':
      return match(['小腿后']);
    case 'feet':
    case 'adductors':
      return match(['大腿后', '腘', '小腿后']);
    default:
      return list;
  }
}

function applySideFilter(list: BodyPart[], pick: HighlighterPick): BodyPart[] {
  if (!pick.side) return list;

  if (pick.zone === '胸部') {
    return list.filter(
      (p) => p.label.includes(pick.side!) || p.label === '胸骨正中',
    );
  }
  if (pick.zone === '后视图') {
    const sided = list.filter((p) => p.label.includes(pick.side!));
    const mid = list.filter(
      (p) =>
        p.label.includes('正中') ||
        p.label.includes('骶尾') ||
        p.label.includes('后枕') ||
        p.label.includes('颈后') ||
        p.label.includes('颈椎') ||
        p.label.includes('胸椎') ||
        p.label.includes('腰椎'),
    );
    // 后视点选已按 slug 再筛；侧别时保留正中类
    if (!sided.length) return list;
    return [...sided, ...mid.filter((m) => !sided.includes(m))];
  }
  if (pick.zone === '腹部' && pick.slug === 'obliques') {
    return list.filter(
      (p) => p.label.includes(pick.side!) || p.label === '脐部',
    );
  }
  return list.filter((p) => p.label.includes(pick.side!));
}

function partsForPick(pick: HighlighterPick): BodyPart[] {
  if (pick.view === 'front') {
    if (pick.slug === 'head' || pick.slug === 'hair') {
      return [
        ...partsByZone('front', '头面部').filter((p) => !p.label.includes('颈')),
        ...partsByZone('front', '鼻部'),
        ...partsByZone('front', '咽喉部').filter((p) => p.id === 'f-throat-adenoid'),
      ];
    }
    if (pick.slug === 'neck') {
      return [
        ...partsByZone('front', '头面部').filter((p) => p.label.includes('颈')),
        ...partsByZone('front', '颈部'),
        ...partsByZone('front', '咽喉部').filter((p) => p.id !== 'f-throat-adenoid'),
      ];
    }
  }
  return partsByZone(pick.view, pick.zone);
}

export function filterPartsForPick(pick: HighlighterPick): BodyPart[] {
  const zoneList = partsForPick(pick);
  const sided = applySideFilter(zoneList, pick);
  // slug=custom：按分区(+侧)列出该区全部用语（如腹部九分）
  if ((pick.slug as string) === 'custom' || !pick.slug) {
    return sided;
  }
  const bySlug = filterBySlug(sided, pick.view, pick.slug);
  return bySlug.length ? bySlug : sided;
}

/** 精细区不填整块库肌肉（由 surgicalAdaptation 曲线蒙版高亮） */
function skipMuscleFill(part: BodyPart): boolean {
  if (part.zone === '腹部') return true;
  if (part.view === 'front' && part.zone === '头面部') {
    if (part.label === '头部') return false;
    if (part.label.includes('颈')) return false;
    return true;
  }
  if (part.view === 'front' && (part.zone === '咽喉部' || part.zone === '鼻部')) {
    return true;
  }
  if (part.view === 'front' && part.zone === '颈部') return true;
  if (part.view === 'front' && part.zone === '胸部') return true;
  return false;
}

/** 单个手术部位 → highlighter 条目（不含合并）；精细区返回 null */
function partToHighlightItem(part: BodyPart): ExtendedBodyPart | null {
  if (skipMuscleFill(part)) return null;

  const anatomical: '左' | '右' | undefined = part.label.includes('左')
    ? '左'
    : part.label.includes('右')
      ? '右'
      : undefined;
  const side = svgSideFromAnatomical(part.view, anatomical);

  let slug: Slug = 'abs';

  if (part.view === 'front') {
    if (part.zone === '咽喉部' || part.zone === '鼻部') {
      slug = 'head';
    } else if (part.zone === '颈部') {
      slug = 'neck';
    } else if (part.zone === '头面部') {
      slug = part.label.includes('颈') ? 'neck' : 'head';
    } else if (part.zone === '胸部') {
      slug = 'chest';
    } else if (part.zone === '上肢') {
      if (part.label.includes('手')) slug = 'hands';
      else if (part.label.includes('前臂')) slug = 'forearm';
      else if (part.label.includes('肘')) slug = 'biceps';
      else if (part.label.includes('上臂')) slug = 'biceps';
      else if (part.label.includes('肩')) slug = 'deltoids';
      else slug = 'forearm';
    } else if (part.zone === '下肢') {
      if (part.label.includes('足')) slug = 'feet';
      else if (part.label.includes('踝')) slug = 'ankles';
      else if (part.label.includes('膝')) slug = 'knees';
      else if (part.label.includes('小腿')) slug = 'tibialis';
      else if (part.label.includes('髋')) slug = 'adductors';
      else slug = 'quadriceps';
    }
  } else {
    if (part.label.includes('枕')) slug = 'head';
    else if (part.label.includes('颈')) slug = 'neck';
    else if (part.label.includes('肩背')) slug = 'deltoids';
    else if (part.label.includes('胸椎') || part.label.includes('正中'))
      slug = 'upper-back';
    else if (part.label.includes('骶')) slug = 'gluteal';
    else if (part.label.includes('腰')) slug = 'lower-back';
    else if (part.label.includes('腘')) slug = 'hamstring';
    else if (part.label.includes('小腿')) slug = 'calves';
    else if (part.label.includes('大腿')) slug = 'hamstring';
    else slug = 'upper-back';
  }

  return {
    slug,
    side,
    styles: { fill: '#E74C3C' },
  };
}

/**
 * 多选手术部位 → highlighter 高亮
 * 同一 slug 若左右都选中，则不传 side（两侧一起红）
 */
export function surgicalPartsToHighlight(
  partIds: string[],
): ExtendedBodyPart[] {
  const parts = partIds
    .map((id) => getPartById(id))
    .filter((p): p is BodyPart => Boolean(p));

  const bySlug = new Map<
    string,
    { left: boolean; right: boolean; both: boolean; slug: Slug }
  >();

  for (const part of parts) {
    const item = partToHighlightItem(part);
    if (!item?.slug) continue;
    const key = item.slug;
    const cur = bySlug.get(key) ?? {
      left: false,
      right: false,
      both: false,
      slug: item.slug,
    };
    if (!item.side) cur.both = true;
    else if (item.side === 'left') cur.left = true;
    else cur.right = true;
    bySlug.set(key, cur);
  }

  const result: ExtendedBodyPart[] = [];
  bySlug.forEach((sides) => {
    const { slug } = sides;
    if (sides.both || (sides.left && sides.right)) {
      result.push({ slug, styles: { fill: '#E74C3C' } });
    } else if (sides.left) {
      result.push({ slug, side: 'left', styles: { fill: '#E74C3C' } });
    } else if (sides.right) {
      result.push({ slug, side: 'right', styles: { fill: '#E74C3C' } });
    }
  });
  return result;
}

/** @deprecated 使用 surgicalPartsToHighlight */
export function surgicalPartToHighlight(
  partId: string | null,
): ExtendedBodyPart[] {
  return surgicalPartsToHighlight(partId ? [partId] : []);
}

export function allSurgicalParts(): BodyPart[] {
  return BODY_PARTS;
}

