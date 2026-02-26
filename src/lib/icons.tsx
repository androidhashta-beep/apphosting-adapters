"use client";

import { User, Ticket, Award, Building, DollarSign, BookOpen, HelpCircle, UserPlus, Settings, Wrench, Package, ShieldCheck, Play, Pause, Volume2, VolumeX, History, ImageOff } from 'lucide-react';
import type { LucideProps } from 'lucide-react';

export const iconMap: { [key: string]: React.FC<LucideProps> } = {
  User,
  Ticket,
  Award,
  Building,
  DollarSign,
  BookOpen,
  UserPlus,
  Settings,
  Wrench,
  Package,
  ShieldCheck,
  Play,
  Pause,
  Volume2,
  VolumeX,
  HelpCircle,
  History,
  ImageOff,
};

export const iconList = Object.keys(iconMap);

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const LucideIcon = iconMap[name] || HelpCircle;
  return <LucideIcon {...props} />;
};
