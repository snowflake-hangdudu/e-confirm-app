export type Role = 'patient' | 'family';
export type BodyView = 'front' | 'back';

export type BodyPart = {
  id: string;
  label: string;
  view: BodyView;
  zone: string;
};

export type SessionState = {
  role: Role;
  department: string;
  patientName: string;
  /** 住院号（导出字段） */
  admissionNo: string;
  bedNo: string;
  familyName: string;
  relation: string;
  selectedPartIds: string[];
  bodyGender: 'male' | 'female';
  bodyView: BodyView;
  plannedSurgeryName: string;
  plannedSite: string;
  nurseName: string;
  familySigned: boolean;
  familySignaturePaths: string[];
  confirmedAt: string | null;
  compareResult: 'match' | 'mismatch' | null;
  /** 患者已点「提交」指认结果 */
  siteSubmitted: boolean;
  /** 点过「重新选择」次数；0 表示一次选对 */
  reselectCount: number;
};

/** 本机落库 / 日后后台导出的一行（院方表格字段） */
export type ConfirmExportRecord = {
  id: string;
  confirmedAt: string;
  department: string;
  admissionNo: string;
  firstPickCorrect: boolean;
  confirmerName: string;
  /** 以下为后台扩展用，不进当前导出表 */
  siteLabels: string[];
  role: Role;
  nurseName: string;
  patientName: string;
  /** 家属签字图（data URL）；患者本人确认可为空 */
  signatureImage?: string;
  synced: boolean;
};

/** 确认流程：逐步跳转 */
export type ConfirmStackParamList = {
  Welcome: undefined;
  ConfirmSite: undefined;
};

/** 底部仅保留：确认流程 / 我的 */
export type MainTabParamList = {
  ConfirmFlow: undefined;
  Mine: undefined;
};
