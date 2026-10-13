import React from 'react';
import {
  Code2,
  Code,
  Terminal,
  Dumbbell,
  Bike,
  Waves,
  Smile,
  Footprints,
  Activity,
  BookOpen,
  Book,
  GraduationCap,
  Languages,
  Palette,
  Brush,
  Camera,
  Scissors,
  PenTool,
  Music,
  Headphones,
  Mic,
  Disc,
  Brain,
  HeartPulse,
  Heart,
  Sparkles,
  Droplets,
  Apple,
  Moon,
  Sun,
  Bed,
  Target,
  CheckCircle2,
  Calendar,
  Clock,
  Timer,
  Zap,
  FolderCheck,
  Coffee,
  Compass,
  Users,
  Flame,
  Trophy,
  Shield,
  Award,
  Crown,
  Star,
  LucideIcon,
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  // Coding / Tech
  code2: Code2,
  code: Code,
  terminal: Terminal,

  // Fitness / Sport
  dumbbell: Dumbbell,
  bike: Bike,
  waves: Waves,
  smile: Smile,
  footprints: Footprints,
  activity: Activity,

  // Learning / Reading
  bookopen: BookOpen,
  book: Book,
  graduationcap: GraduationCap,
  languages: Languages,

  // Creative / Arts
  palette: Palette,
  brush: Brush,
  camera: Camera,
  scissors: Scissors,
  pentool: PenTool,

  // Music
  music: Music,
  headphones: Headphones,
  mic: Mic,
  disc: Disc,

  // Mind & Health
  brain: Brain,
  heartpulse: HeartPulse,
  heart: Heart,
  sparkles: Sparkles,
  droplets: Droplets,
  apple: Apple,
  moon: Moon,
  sun: Sun,
  bed: Bed,

  // Productivity / Life
  target: Target,
  checkcircle2: CheckCircle2,
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  zap: Zap,
  foldercheck: FolderCheck,
  coffee: Coffee,
  compass: Compass,
  users: Users,

  // Gamification & Badges
  flame: Flame,
  trophy: Trophy,
  shield: Shield,
  award: Award,
  crown: Crown,
  star: Star,
};

interface HabitIconProps {
  name?: string | null;
  className?: string;
  size?: number;
  fallback?: LucideIcon;
}

export const HabitIcon: React.FC<HabitIconProps> = ({
  name,
  className = 'w-5 h-5',
  size,
  fallback: FallbackIcon = Sparkles,
}) => {
  if (!name) {
    return <FallbackIcon className={className} size={size} />;
  }

  // Normalize name by trimming, removing non-alphanumeric, and converting to lowercase
  const normalized = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  const IconComponent = ICON_MAP[normalized];

  if (!IconComponent) {
    return <FallbackIcon className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};

export default HabitIcon;
