'use client';

import type { Settings } from '@/lib/types';

type InfoPanelProps = {
  settings: Settings | null;
  contentType: 'images' | 'videos' | 'all';
}

export function InfoPanel({ settings, contentType }: InfoPanelProps) {
  return null;
}
