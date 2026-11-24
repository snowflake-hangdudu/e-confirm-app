import * as Speech from 'expo-speech';
import { Platform } from 'react-native';

let cachedVoiceId: string | null | undefined;

export function stopSiteSpeech() {
  try {
    Speech.stop();
  } catch {
    // ignore
  }
}

/** 优先选增强版 / 本地常见中文女声 */
async function resolveChineseVoice(): Promise<string | undefined> {
  if (cachedVoiceId !== undefined) {
    return cachedVoiceId ?? undefined;
  }

  try {
    let voices = await Speech.getAvailableVoicesAsync();
    if (!voices.length) {
      await new Promise((r) => setTimeout(r, 400));
      voices = await Speech.getAvailableVoicesAsync();
    }

    const zh = voices.filter(
      (v) =>
        v.language?.toLowerCase().startsWith('zh') ||
        /chinese|中文|普通话|国语/i.test(v.name || ''),
    );

    const preferName =
      /tingting|xiaoxiao|xiaoyi|yaoyao|huihui|meijia|sinji|yunyang|neural|premium|enhanced|女/i;

    const ranked = [...zh].sort((a, b) => {
      const score = (v: (typeof zh)[0]) => {
        let s = 0;
        if (v.quality === 'Enhanced') s += 5;
        if (preferName.test(v.name || '')) s += 3;
        if (v.language?.toLowerCase() === 'zh-cn') s += 2;
        if (v.language?.toLowerCase().startsWith('zh-cn')) s += 1;
        return s;
      };
      return score(b) - score(a);
    });

    cachedVoiceId = ranked[0]?.identifier ?? null;
  } catch {
    cachedVoiceId = null;
  }

  return cachedVoiceId ?? undefined;
}

/** 把字典短名说成更顺口的医学口语 */
export function toSpokenSiteLabel(label: string): string {
  const map: Record<string, string> = {
    头部: '头部',
    额部: '额部',
    左眼: '左侧眼部',
    右眼: '右侧眼部',
    左耳: '左侧耳部',
    右耳: '右侧耳部',
    鼻部: '鼻部',
    左面部: '左侧面部',
    右面部: '右侧面部',
    唇部: '唇部',
    颈前部: '颈前部',
    颈左部: '颈部左侧',
    颈右部: '颈部右侧',
    左胸: '左侧胸部',
    右胸: '右侧胸部',
    胸骨正中: '胸骨正中',
    左乳: '左侧乳房',
    右乳: '右侧乳房',
    右上腹: '右侧上腹部',
    上腹部: '上腹部',
    左上腹: '左侧上腹部',
    脐部: '脐部',
    右下腹: '右侧下腹部',
    下腹部: '下腹部',
    左下腹: '左侧下腹部',
    左肩: '左侧肩部',
    右肩: '右侧肩部',
    左上臂: '左侧上臂',
    右上臂: '右侧上臂',
    左肘: '左侧肘部',
    右肘: '右侧肘部',
    左前臂: '左侧前臂',
    右前臂: '右侧前臂',
    左手: '左手',
    右手: '右手',
    扁桃体: '扁桃体',
    腺样体: '腺样体',
    咽部: '咽部',
    '喉部/声带': '喉部及声带',
    '鼻腔/鼻中隔': '鼻腔及鼻中隔',
    鼻甲: '鼻甲',
    鼻窦: '鼻窦',
    甲状腺: '甲状腺',
    甲状旁腺: '甲状旁腺',
    颈部淋巴结: '颈部淋巴结',
    左髋: '左侧髋部',
    右髋: '右侧髋部',
    左大腿: '左侧大腿',
    右大腿: '右侧大腿',
    左膝: '左侧膝盖',
    右膝: '右侧膝盖',
    左小腿: '左侧小腿',
    右小腿: '右侧小腿',
    左踝: '左侧踝部',
    右踝: '右侧踝部',
    左足: '左足',
    右足: '右足',
    后枕部: '后枕部',
    颈后部: '颈后部',
    颈椎: '颈椎',
    左肩背部: '左侧肩背部',
    右肩背部: '右侧肩背部',
    背部正中: '背部正中',
    胸椎: '胸椎',
    左腰臀部: '左侧腰臀部',
    右腰臀部: '右侧腰臀部',
    腰椎: '腰椎',
    骶尾部: '骶尾部',
    左大腿后侧: '左侧大腿后侧',
    右大腿后侧: '右侧大腿后侧',
    左腘窝: '左侧腘窝',
    右腘窝: '右侧腘窝',
    左小腿后侧: '左侧小腿后侧',
    右小腿后侧: '右侧小腿后侧',
  };

  return map[label] ?? label;
}

/**
 * 更自然的部位朗读；Promise 在播完 / 停止 / 失败后结束。
 */
export async function speakSiteConfirm(
  siteLabel: string | string[],
): Promise<void> {
  stopSiteSpeech();

  const voice = await resolveChineseVoice();
  const labels = Array.isArray(siteLabel) ? siteLabel : [siteLabel];
  const spokenList = labels.map(toSpokenSiteLabel);
  const text =
    spokenList.length === 1
      ? `请您确认。手术部位是：${spokenList[0]}。`
      : `请您确认。手术部位共${spokenList.length}处：${spokenList.join('，')}。`;

  const rate = Platform.OS === 'web' ? 0.95 : 0.88;
  const pitch = Platform.OS === 'web' ? 1.02 : 1.05;

  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    // Web / 部分机型回调缺失时兜底，避免按钮一直灰
    const fallbackMs = Math.min(20000, Math.max(2500, text.length * 220));
    const timer = setTimeout(finish, fallbackMs);

    Speech.speak(text, {
      language: 'zh-CN',
      voice,
      rate,
      pitch,
      volume: 1,
      onDone: () => {
        clearTimeout(timer);
        finish();
      },
      onStopped: () => {
        clearTimeout(timer);
        finish();
      },
      onError: () => {
        clearTimeout(timer);
        finish();
      },
    });
  });
}
