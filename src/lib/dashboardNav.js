import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  FileCheck2,
  TrendingUp,
  Layers,
  Send,
  Users,
  UsersRound,
  Sparkles,
} from 'lucide-react';

export const studentNav = [
  { to: '/dashboard/pregled', label: 'Pregled', icon: LayoutDashboard },
  { to: '/dashboard/udzbenik', label: 'Udžbenik i lekcije', icon: BookOpen },
  { to: '/dashboard/zadaca', label: 'Domaća zadaća', icon: ClipboardList },
  { to: '/dashboard/ispiti', label: 'Ispiti znanja', icon: FileCheck2 },
  { to: '/dashboard/napredak', label: 'Napredak', icon: TrendingUp },
];

export const teacherNav = [
  { to: '/dashboard/upravljanje', label: 'Upravljanje gradivom', icon: Layers },
  { to: '/dashboard/dodjele', label: 'Dodjele', icon: Send },
  { to: '/dashboard/grupe', label: 'Grupe', icon: UsersRound },
  { to: '/dashboard/ucenici', label: 'Učenici', icon: Users },
  { to: '/dashboard/predaje', label: 'AI pregledi', icon: Sparkles },
];