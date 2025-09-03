"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { 
  ShoppingCart,
  CheckCircle,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  ClipboardList,
  Timer,
  Factory,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  Target,
  Zap,
  Calendar,
  FileText,
  Settings,
  Truck,
  Wrench,
  Archive,
  List,
  PieChart,
  TrendingDown,
  Eye,
  Star,
  Heart,
  Award,
  Shield,
  Lock,
  Unlock,
  Download,
  Upload,
  Send,
  Mail,
  Phone,
  MapPin,
  Home,
  Building,
  User,
  UserCheck,
  UserPlus,
  UserMinus,
  Bell,
  Search,
  Filter,
  Grid,
  Layout,
  Layers,
  Box,
  Database,
  Server,
  Cloud,
  Wifi,
  Globe,
  Link,
  Share,
  Copy,
  Edit,
  Trash,
  Plus,
  Minus,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  Power,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Percent,
  Calculator,
  CreditCard,
  Wallet,
  Receipt,
  ShoppingBag,
  Gift,
  Ticket,
  Cog,
  Hammer,
  Coins,
  GitBranch
} from "lucide-react"

// Icon mapping
const iconMap = {
  ShoppingCart,
  CheckCircle,
  Package,
  AlertTriangle,
  Users,
  TrendingUp,
  ClipboardList,
  Timer,
  Factory,
  Clock,
  DollarSign,
  Activity,
  BarChart3,
  Target,
  Zap,
  Calendar,
  FileText,
  Settings,
  Truck,
  Wrench,
  Archive,
  List,
  PieChart,
  TrendingDown,
  Eye,
  Star,
  Heart,
  Award,
  Shield,
  Lock,
  Unlock,
  Download,
  Upload,
  Send,
  Mail,
  Phone,
  MapPin,
  Home,
  Building,
  User,
  UserCheck,
  UserPlus,
  UserMinus,
  Bell,
  Search,
  Filter,
  Grid,
  Layout,
  Layers,
  Box,
  Database,
  Server,
  Cloud,
  Wifi,
  Globe,
  Link,
  Share,
  Copy,
  Edit,
  Trash,
  Plus,
  Minus,
  X,
  Check,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  RotateCcw,
  Power,
  PlayCircle,
  PauseCircle,
  StopCircle,
  Square,
  Circle,
  Triangle,
  Hexagon,
  Flag,
  Bookmark,
  Tag,
  Hash,
  AtSign,
  Percent,
  Calculator,
  CreditCard,
  Wallet,
  Receipt,
  ShoppingBag,
  Gift,
  Ticket,
  Cog,
  Hammer,
  Coins,
  GitBranch
} as const

export type IconName = keyof typeof iconMap

export interface AnalyticsCardProps {
  title: string
  value: string | number
  icon?: IconName
  iconColor?: string
  bgColor?: string
  borderColor?: string
  subtitle?: string
  className?: string
  onClick?: () => void
}

const AnalyticsCard = React.forwardRef<HTMLDivElement, AnalyticsCardProps>(
  ({
    title,
    value,
    icon,
    iconColor = "text-primary",
    bgColor = "bg-primary/5",
    borderColor = "border-primary/20",
    subtitle,
    className,
    onClick,
    ...props
  }, ref) => {
    const IconComponent = icon ? iconMap[icon] : undefined

    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "relative rounded-lg border p-6 transition-all duration-200",
          // Background and border with low opacity
          bgColor,
          borderColor,
          // Hover effects
          "hover:border-opacity-40 hover:bg-opacity-10",
          // Responsive padding
          "p-4 sm:p-6",
          // Click cursor if onClick provided
          onClick && "cursor-pointer hover:scale-[1.02]",
          className
        )}
        onClick={onClick}
        {...props}
      >
        <div className="flex items-center space-x-4">
          {/* Icon Section */}
          {IconComponent && (
            <div className="flex-shrink-0">
              <IconComponent className={cn("h-8 w-8", iconColor)} />
            </div>
          )}
          
          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-muted-foreground truncate">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground mt-1 sm:text-3xl">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }
)

AnalyticsCard.displayName = "AnalyticsCard"

// Predefined color variants for common use cases
export const analyticsCardVariants = {
  blue: {
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50/80 dark:bg-blue-950/20",
    borderColor: "border-blue-200/60 dark:border-blue-800/40",
  },
  green: {
    iconColor: "text-green-500", 
    bgColor: "bg-green-50/80 dark:bg-green-950/20",
    borderColor: "border-green-200/60 dark:border-green-800/40",
  },
  amber: {
    iconColor: "text-amber-500",
    bgColor: "bg-amber-50/80 dark:bg-amber-950/20", 
    borderColor: "border-amber-200/60 dark:border-amber-800/40",
  },
  red: {
    iconColor: "text-red-500",
    bgColor: "bg-red-50/80 dark:bg-red-950/20",
    borderColor: "border-red-200/60 dark:border-red-800/40",
  },
  orange: {
    iconColor: "text-orange-500",
    bgColor: "bg-orange-50/80 dark:bg-orange-950/20",
    borderColor: "border-orange-200/60 dark:border-orange-800/40",
  },
  purple: {
    iconColor: "text-purple-500",
    bgColor: "bg-purple-50/80 dark:bg-purple-950/20",
    borderColor: "border-purple-200/60 dark:border-purple-800/40",
  },
  slate: {
    iconColor: "text-slate-500",
    bgColor: "bg-slate-50/80 dark:bg-slate-950/20",
    borderColor: "border-slate-200/60 dark:border-slate-800/40",
  },
}

export { AnalyticsCard } 