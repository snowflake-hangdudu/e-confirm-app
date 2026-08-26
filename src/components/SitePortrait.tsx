import React from 'react';
import { BodyMapPreview } from './BodyMap';
import { BodyView } from '../types';

type Props = {
  partIds: string[];
  partLabel: string;
  view?: BodyView;
  gender?: 'male' | 'female';
  compact?: boolean;
};

/** 确认卡核心画像：精细热区高亮 */
export function SitePortrait({
  partIds,
  view = 'front',
  gender = 'male',
  compact = false,
}: Props) {
  return (
    <BodyMapPreview
      view={view}
      gender={gender}
      selectedPartIds={partIds}
      compact={compact}
    />
  );
}
