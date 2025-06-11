import React from 'react'
import {
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  UserIcon,
  HandRaisedIcon,
  FireIcon,
  ViewfinderCircleIcon,
  HomeIcon,
  ClipboardDocumentListIcon,
  GiftIcon,
  CogIcon,
  ChartBarIcon,
  CalendarIcon,
  ClockIcon,
  TrophyIcon,
  StarIcon,
  HeartIcon,
  BookOpenIcon,
  WrenchScrewdriverIcon,
  ShoppingCartIcon,
  CakeIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  MusicalNoteIcon,
  CameraIcon,
  PaintBrushIcon,
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  SunIcon,
  MoonIcon,
  CloudIcon,
  BoltIcon,
  BeakerIcon,
  RocketLaunchIcon,
  LightBulbIcon,
  PuzzlePieceIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  PencilIcon,
  TrashIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  ForwardIcon,
  BackwardIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  VideoCameraIcon,
  PhotoIcon,
  DocumentIcon,
  FolderIcon,
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  LockClosedIcon,
  LockOpenIcon,
  KeyIcon,
  ShieldCheckIcon,
  EllipsisHorizontalIcon,
  Cog6ToothIcon,
  BanknotesIcon,
  CurrencyDollarIcon,
  CreditCardIcon,
  CalculatorIcon,
  ScaleIcon,
  BuildingOfficeIcon,
  CubeIcon,
  Squares2X2Icon,
  ListBulletIcon,
  TableCellsIcon,
  ChartPieIcon,
  PresentationChartLineIcon,
  NoSymbolIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline'

export type IconType = 
  // UI Actions
  | 'complete' | 'incomplete' | 'approved' | 'rejected' | 'pending'
  | 'add' | 'remove' | 'edit' | 'delete' | 'search' | 'filter' | 'refresh'
  | 'close' | 'menu' | 'more' | 'settings' | 'info' | 'warning' | 'error'
  
  // Navigation
  | 'home' | 'back' | 'forward' | 'up' | 'down' | 'left' | 'right'
  
  // User & Family
  | 'user' | 'parent' | 'child' | 'family' | 'avatar' | 'profile'
  
  // Tasks & Activities  
  | 'task' | 'tasks' | 'checklist' | 'target' | 'goal' | 'deadline'
  | 'repeat' | 'schedule' | 'calendar' | 'clock' | 'timer'
  
  // Achievements & Rewards
  | 'trophy' | 'award' | 'star' | 'fire' | 'streak' | 'points' | 'badge'
  | 'gift' | 'reward' | 'celebration' | 'heart' | 'rocket'
  
  // Money & Allowance
  | 'money' | 'dollar' | 'banknotes' | 'payment' | 'calculator' | 'scale'
  
  // Notifications & Communication
  | 'bell' | 'notification' | 'message' | 'email' | 'phone' | 'alert'
  
  // Media & Content
  | 'photo' | 'video' | 'music' | 'document' | 'folder' | 'upload' | 'download'
  
  // Security
  | 'lock' | 'unlock' | 'key' | 'shield' | 'security'
  
  // Categories & Icons for tasks
  | 'clean' | 'homework' | 'chores' | 'cooking' | 'laundry' | 'shopping' 
  | 'reading' | 'exercise' | 'creative' | 'technology' | 'outdoor'
  | 'learning' | 'helping' | 'organization'
  
  // Emotions & Status
  | 'happy' | 'sad' | 'neutral' | 'excited' | 'focused'
  
  // Weather & Time
  | 'sun' | 'moon' | 'cloud' | 'weather'
  
  // Tech & Gaming
  | 'computer' | 'game' | 'app' | 'web'
  
  // Reports & Analytics
  | 'chart' | 'report' | 'analytics' | 'graph' | 'statistics'
  
  // Actions & Controls
  | 'play' | 'pause' | 'stop' | 'record' | 'volume' | 'mute'
  
  // Looking/Watching
  | 'eye' | 'watch' | 'view' | 'preview'
  
  // Gestures
  | 'wave' | 'thumbs-up' | 'clap'
  
  // Switching & Changes
  | 'switch'

export interface IconProps {
  type: IconType
  size?: number
  className?: string
  'aria-label'?: string
}

export const IconMap: React.FC<IconProps> = ({ 
  type, 
  size = 20, 
  className = '', 
  'aria-label': ariaLabel 
}) => {
  const iconProps = {
    width: size,
    height: size,
    className,
    'aria-label': ariaLabel
  }

  switch (type) {
    // UI Actions
    case 'complete':
    case 'approved':
      return <CheckCircleIcon {...iconProps} />
    case 'incomplete':
    case 'pending':
      return <ClockIcon {...iconProps} />
    case 'rejected':
      return <XCircleIcon {...iconProps} />
    case 'add':
      return <PlusIcon {...iconProps} />
    case 'remove':
    case 'delete':
      return <TrashIcon {...iconProps} />
    case 'edit':
      return <PencilIcon {...iconProps} />
    case 'search':
      return <MagnifyingGlassIcon {...iconProps} />
    case 'refresh':
      return <ArrowPathIcon {...iconProps} />
    case 'close':
      return <XMarkIcon {...iconProps} />
    case 'menu':
      return <Bars3Icon {...iconProps} />
    case 'more':
      return <EllipsisHorizontalIcon {...iconProps} />
    case 'settings':
      return <CogIcon {...iconProps} />
    case 'info':
      return <InformationCircleIcon {...iconProps} />
    case 'warning':
      return <ExclamationTriangleIcon {...iconProps} />
    case 'error':
      return <XCircleIcon {...iconProps} />

    // Navigation
    case 'home':
      return <HomeIcon {...iconProps} />
    case 'back':
    case 'left':
      return <ArrowLeftIcon {...iconProps} />
    case 'forward':
    case 'right':
      return <ArrowRightIcon {...iconProps} />
    case 'up':
      return <ChevronUpIcon {...iconProps} />
    case 'down':
      return <ChevronDownIcon {...iconProps} />

    // User & Family
    case 'user':
    case 'profile':
    case 'avatar':
      return <UserIcon {...iconProps} />
    case 'parent':
      return <BriefcaseIcon {...iconProps} />
    case 'child':
      return <AcademicCapIcon {...iconProps} />
    case 'family':
      return <HomeIcon {...iconProps} />

    // Tasks & Activities
    case 'task':
      return <CheckIcon {...iconProps} />
    case 'tasks':
    case 'checklist':
      return <ClipboardDocumentListIcon {...iconProps} />
    case 'target':
    case 'goal':
      return <ViewfinderCircleIcon {...iconProps} />
    case 'calendar':
      return <CalendarIcon {...iconProps} />
    case 'clock':
    case 'timer':
      return <ClockIcon {...iconProps} />

    // Achievements & Rewards
    case 'trophy':
    case 'award':
      return <TrophyIcon {...iconProps} />
    case 'star':
      return <StarIcon {...iconProps} />
    case 'fire':
    case 'streak':
      return <FireIcon {...iconProps} />
    case 'points':
      return <ViewfinderCircleIcon {...iconProps} />
    case 'gift':
    case 'reward':
      return <GiftIcon {...iconProps} />
    case 'heart':
      return <HeartIcon {...iconProps} />
    case 'rocket':
      return <RocketLaunchIcon {...iconProps} />

    // Money & Allowance
    case 'money':
    case 'banknotes':
      return <BanknotesIcon {...iconProps} />
    case 'dollar':
    case 'payment':
      return <CurrencyDollarIcon {...iconProps} />
    case 'calculator':
      return <CalculatorIcon {...iconProps} />

    // Notifications
    case 'bell':
    case 'notification':
      return <BellIcon {...iconProps} />
    case 'email':
    case 'message':
      return <EnvelopeIcon {...iconProps} />
    case 'phone':
      return <PhoneIcon {...iconProps} />

    // Security
    case 'lock':
      return <LockClosedIcon {...iconProps} />
    case 'unlock':
      return <LockOpenIcon {...iconProps} />
    case 'key':
      return <KeyIcon {...iconProps} />
    case 'shield':
    case 'security':
      return <ShieldCheckIcon {...iconProps} />

    // Task Categories
    case 'clean':
    case 'chores':
      return <WrenchScrewdriverIcon {...iconProps} />
    case 'homework':
    case 'learning':
      return <BookOpenIcon {...iconProps} />
    case 'cooking':
      return <FireIcon {...iconProps} />
    case 'shopping':
      return <ShoppingCartIcon {...iconProps} />
    case 'reading':
      return <BookOpenIcon {...iconProps} />
    case 'creative':
      return <PaintBrushIcon {...iconProps} />
    case 'technology':
    case 'computer':
      return <ComputerDesktopIcon {...iconProps} />
    case 'phone':
      return <DevicePhoneMobileIcon {...iconProps} />

    // Emotions
    case 'happy':
    case 'excited':
      return <FaceSmileIcon {...iconProps} />
    case 'sad':
      return <FaceFrownIcon {...iconProps} />
    case 'wave':
      return <HandRaisedIcon {...iconProps} />

    // Weather
    case 'sun':
      return <SunIcon {...iconProps} />
    case 'moon':
      return <MoonIcon {...iconProps} />
    case 'cloud':
    case 'weather':
      return <CloudIcon {...iconProps} />

    // Reports & Analytics
    case 'chart':
    case 'analytics':
    case 'statistics':
      return <ChartBarIcon {...iconProps} />
    case 'report':
      return <DocumentIcon {...iconProps} />

    // Media Controls
    case 'play':
      return <PlayIcon {...iconProps} />
    case 'pause':
      return <PauseIcon {...iconProps} />
    case 'stop':
      return <StopIcon {...iconProps} />

    // Looking/Watching
    case 'eye':
    case 'watch':
    case 'view':
    case 'preview':
      return <EyeIcon {...iconProps} />

    // Switching & Changes
    case 'switch':
      return <ArrowPathIcon {...iconProps} />

    // Default fallback
    default:
      console.warn(`IconMap: Unknown icon type "${type}"`)
      return <QuestionMarkCircleIcon {...iconProps} />
  }
}

export default IconMap 