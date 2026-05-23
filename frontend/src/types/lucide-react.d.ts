declare module 'lucide-react' {
  import { FC, SVGProps } from 'react';

  interface IconProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  type Icon = FC<IconProps>;

  export const Activity: Icon;
  export const AlertCircle: Icon;
  export const AlertTriangle: Icon;
  export const ArrowLeft: Icon;
  export const BarChart3: Icon;
  export const Bell: Icon;
  export const Building2: Icon;
  export const Calendar: Icon;
  export const Check: Icon;
  export const CheckCircle2: Icon;
  export const ChevronDown: Icon;
  export const ChevronLeft: Icon;
  export const ChevronRight: Icon;
  export const Clock: Icon;
  export const Database: Icon;
  export const Download: Icon;
  export const Edit3: Icon;
  export const ExternalLink: Icon;
  export const FileSpreadsheet: Icon;
  export const FileText: Icon;
  export const Filter: Icon;
  export const Globe: Icon;
  export const Hash: Icon;
  export const HelpCircle: Icon;
  export const Inbox: Icon;
  export const Info: Icon;
  export const Key: Icon;
  export const LayoutDashboard: Icon;
  export const LineChart: Icon;
  export const Loader2: Icon;
  export const LogOut: Icon;
  export const Mail: Icon;
  export const Menu: Icon;
  export const MessageSquare: Icon;
  export const Moon: Icon;
  export const MoreHorizontal: Icon;
  export const Pause: Icon;
  export const Phone: Icon;
  export const PieChart: Icon;
  export const Play: Icon;
  export const Plus: Icon;
  export const RefreshCw: Icon;
  export const Save: Icon;
  export const Search: Icon;
  export const Send: Icon;
  export const Settings: Icon;
  export const Settings2: Icon;
  export const Smartphone: Icon;
  export const SortAsc: Icon;
  export const SortDesc: Icon;
  export const Sun: Icon;
  export const Table2: Icon;
  export const Tag: Icon;
  export const Target: Icon;
  export const TestTube: Icon;
  export const Trash2: Icon;
  export const TrendingUp: Icon;
  export const Upload: Icon;
  export const UserCheck: Icon;
  export const Users: Icon;
  export const X: Icon;
  export const XCircle: Icon;
}
