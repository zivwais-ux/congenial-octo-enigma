import { Archive, LayoutGrid, Upload, type LucideIcon } from 'lucide-react';
import type { Role } from '../../types';

export interface NavEntry {
  to: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV: NavEntry[] = [
  { to: '/', label: 'דשבורד', icon: LayoutGrid, roles: ['designer', 'approver'] },
  { to: '/upload', label: 'העלאת עבודה', icon: Upload, roles: ['designer'] },
  { to: '/archive', label: 'ארכיון', icon: Archive, roles: ['designer', 'approver'] },
];
