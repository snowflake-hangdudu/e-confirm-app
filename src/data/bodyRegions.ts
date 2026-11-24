import { BodyPart, BodyView } from '../types';

/**
 * 手术部位字典 —— 严格按《手术部位.docx》表格：
 * 正视图：①头面部 ②胸部 ③腹部 ④上肢 ⑤下肢
 * 后视图：单列 1–14（不分子区）
 *
 * 说明：正视⑤下肢第 7–12 项原文误写成「左*」，按④上肢左右对称惯例校正为「右*」。
 * 补充：耳鼻咽喉头颈外科用语（咽喉部 / 鼻部 / 颈部细分）。
 */
export const BODY_PARTS: BodyPart[] = [
  // —— 正视图 · ①头面部 ——
  { id: 'f-head', label: '头部', view: 'front', zone: '头面部' },
  { id: 'f-forehead', label: '额部', view: 'front', zone: '头面部' },
  { id: 'f-eye-l', label: '左眼', view: 'front', zone: '头面部' },
  { id: 'f-eye-r', label: '右眼', view: 'front', zone: '头面部' },
  { id: 'f-ear-l', label: '左耳', view: 'front', zone: '头面部' },
  { id: 'f-ear-r', label: '右耳', view: 'front', zone: '头面部' },
  { id: 'f-nose', label: '鼻部', view: 'front', zone: '头面部' },
  { id: 'f-face-l', label: '左面部', view: 'front', zone: '头面部' },
  { id: 'f-face-r', label: '右面部', view: 'front', zone: '头面部' },
  { id: 'f-lip', label: '唇部', view: 'front', zone: '头面部' },
  { id: 'f-neck-front', label: '颈前部', view: 'front', zone: '头面部' },
  { id: 'f-neck-l', label: '颈左部', view: 'front', zone: '头面部' },
  { id: 'f-neck-r', label: '颈右部', view: 'front', zone: '头面部' },

  // —— 正视图 · 咽喉部（ENT 补充）——
  { id: 'f-throat-tonsil', label: '扁桃体', view: 'front', zone: '咽喉部' },
  { id: 'f-throat-adenoid', label: '腺样体', view: 'front', zone: '咽喉部' },
  { id: 'f-throat-pharynx', label: '咽部', view: 'front', zone: '咽喉部' },
  { id: 'f-throat-larynx', label: '喉部/声带', view: 'front', zone: '咽喉部' },

  // —— 正视图 · 鼻部（ENT 细分）——
  { id: 'f-nose-septum', label: '鼻腔/鼻中隔', view: 'front', zone: '鼻部' },
  { id: 'f-nose-turbinate', label: '鼻甲', view: 'front', zone: '鼻部' },
  { id: 'f-nose-sinus', label: '鼻窦', view: 'front', zone: '鼻部' },

  // —— 正视图 · 颈部（ENT 补充）——
  { id: 'f-neck-thyroid', label: '甲状腺', view: 'front', zone: '颈部' },
  { id: 'f-neck-parathyroid', label: '甲状旁腺', view: 'front', zone: '颈部' },
  { id: 'f-neck-lymph', label: '颈部淋巴结', view: 'front', zone: '颈部' },

  // —— 正视图 · ②胸部 ——
  { id: 'f-chest-l', label: '左胸', view: 'front', zone: '胸部' },
  { id: 'f-chest-r', label: '右胸', view: 'front', zone: '胸部' },
  { id: 'f-sternum', label: '胸骨正中', view: 'front', zone: '胸部' },
  { id: 'f-breast-l', label: '左乳', view: 'front', zone: '胸部' },
  { id: 'f-breast-r', label: '右乳', view: 'front', zone: '胸部' },

  // —— 正视图 · ③腹部 ——
  { id: 'f-abd-ru', label: '右上腹', view: 'front', zone: '腹部' },
  { id: 'f-abd-u', label: '上腹部', view: 'front', zone: '腹部' },
  { id: 'f-abd-lu', label: '左上腹', view: 'front', zone: '腹部' },
  { id: 'f-abd-umb', label: '脐部', view: 'front', zone: '腹部' },
  { id: 'f-abd-rl', label: '右下腹', view: 'front', zone: '腹部' },
  { id: 'f-abd-l', label: '下腹部', view: 'front', zone: '腹部' },
  { id: 'f-abd-ll', label: '左下腹', view: 'front', zone: '腹部' },

  // —— 正视图 · ④上肢 ——
  { id: 'f-shoulder-l', label: '左肩', view: 'front', zone: '上肢' },
  { id: 'f-upperarm-l', label: '左上臂', view: 'front', zone: '上肢' },
  { id: 'f-elbow-l', label: '左肘', view: 'front', zone: '上肢' },
  { id: 'f-forearm-l', label: '左前臂', view: 'front', zone: '上肢' },
  { id: 'f-hand-l', label: '左手', view: 'front', zone: '上肢' },
  { id: 'f-shoulder-r', label: '右肩', view: 'front', zone: '上肢' },
  { id: 'f-upperarm-r', label: '右上臂', view: 'front', zone: '上肢' },
  { id: 'f-elbow-r', label: '右肘', view: 'front', zone: '上肢' },
  { id: 'f-forearm-r', label: '右前臂', view: 'front', zone: '上肢' },
  { id: 'f-hand-r', label: '右手', view: 'front', zone: '上肢' },

  // —— 正视图 · ⑤下肢（7–12 项按左右对称校正为右）——
  { id: 'f-hip-l', label: '左髋', view: 'front', zone: '下肢' },
  { id: 'f-thigh-l', label: '左大腿', view: 'front', zone: '下肢' },
  { id: 'f-knee-l', label: '左膝', view: 'front', zone: '下肢' },
  { id: 'f-shin-l', label: '左小腿', view: 'front', zone: '下肢' },
  { id: 'f-ankle-l', label: '左踝', view: 'front', zone: '下肢' },
  { id: 'f-foot-l', label: '左足', view: 'front', zone: '下肢' },
  { id: 'f-hip-r', label: '右髋', view: 'front', zone: '下肢' },
  { id: 'f-thigh-r', label: '右大腿', view: 'front', zone: '下肢' },
  { id: 'f-knee-r', label: '右膝', view: 'front', zone: '下肢' },
  { id: 'f-shin-r', label: '右小腿', view: 'front', zone: '下肢' },
  { id: 'f-ankle-r', label: '右踝', view: 'front', zone: '下肢' },
  { id: 'f-foot-r', label: '右足', view: 'front', zone: '下肢' },

  // —— 后视图（文档单列，统一 zone）——
  { id: 'b-occiput', label: '后枕部', view: 'back', zone: '后视图' },
  { id: 'b-neck', label: '颈后部', view: 'back', zone: '后视图' },
  { id: 'b-cervical', label: '颈椎', view: 'back', zone: '后视图' },
  { id: 'b-shoulder-back-l', label: '左肩背部', view: 'back', zone: '后视图' },
  { id: 'b-shoulder-back-r', label: '右肩背部', view: 'back', zone: '后视图' },
  { id: 'b-back-mid', label: '背部正中', view: 'back', zone: '后视图' },
  { id: 'b-thoracic', label: '胸椎', view: 'back', zone: '后视图' },
  { id: 'b-waist-l', label: '左腰臀部', view: 'back', zone: '后视图' },
  { id: 'b-waist-r', label: '右腰臀部', view: 'back', zone: '后视图' },
  { id: 'b-lumbar', label: '腰椎', view: 'back', zone: '后视图' },
  { id: 'b-sacrum', label: '骶尾部', view: 'back', zone: '后视图' },
  { id: 'b-thigh-l', label: '左大腿后侧', view: 'back', zone: '后视图' },
  { id: 'b-popliteal-l', label: '左腘窝', view: 'back', zone: '后视图' },
  { id: 'b-calf-l', label: '左小腿后侧', view: 'back', zone: '后视图' },
  { id: 'b-thigh-r', label: '右大腿后侧', view: 'back', zone: '后视图' },
  { id: 'b-popliteal-r', label: '右腘窝', view: 'back', zone: '后视图' },
  { id: 'b-calf-r', label: '右小腿后侧', view: 'back', zone: '后视图' },
];

/** 文档分区展示名 */
export const ZONE_LABELS: Record<string, string> = {
  头面部: '①头面部',
  咽喉部: '咽喉部',
  鼻部: '鼻部',
  颈部: '颈部',
  胸部: '②胸部',
  腹部: '③腹部',
  上肢: '④上肢',
  下肢: '⑤下肢',
  后视图: '后视图',
};

export const DEPARTMENTS = [
  '眼科病区',
  '肿瘤外科一病区',
  '肿瘤外科二病区',
  '妇科病区',
  '产科病区',
  '神经外科一病区',
  '神经外科二病区',
  '骨科一病区',
  '骨科二病区',
  '骨科三病区',
  '骨科四病区',
  '普外科一病区',
  '普外科二病区',
  '普外科三病区',
  '普外科四病区',
  '普外科五病区',
  '普外科六病区',
  '泌尿外科一病区',
  '泌尿外科二病区',
  '耳鼻咽喉头颈外科病区',
  '普胸外科病区',
  '心胸外科病区',
  '烧伤整形科',
  '外科特需病房',
  '口腔科',
  '重症监护室',
];

export const RELATIONS = ['无', '配偶', '子女', '父母', '兄弟姐妹', '其他亲属'];

export function getPartById(id: string | null | undefined): BodyPart | undefined {
  if (!id) return undefined;
  return BODY_PARTS.find((p) => p.id === id);
}

export function getPartsByIds(ids: string[]): BodyPart[] {
  return ids
    .map((id) => getPartById(id))
    .filter((p): p is BodyPart => Boolean(p));
}

export function formatSiteLabels(ids: string[]): string {
  const labels = getPartsByIds(ids).map((p) => p.label);
  return labels.length ? labels.join('、') : '—';
}

export function partsByView(view: BodyView): BodyPart[] {
  return BODY_PARTS.filter((p) => p.view === view);
}

export function partsByZone(view: BodyView, zone: string): BodyPart[] {
  return BODY_PARTS.filter((p) => p.view === view && p.zone === zone);
}

export function zoneDisplayName(zone: string): string {
  return ZONE_LABELS[zone] ?? zone;
}
