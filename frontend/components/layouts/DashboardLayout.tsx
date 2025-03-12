import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  Cog6ToothIcon,
  UserGroupIcon,
  ChartBarIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  GlobeAltIcon,
  ArrowTrendingUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  { name: 'Home', href: '/dashboard', icon: HomeIcon },
  { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  { name: 'Refer and earn', href: '/dashboard/refer', icon: UserGroupIcon },
];

const starterBoardItems = [
  { name: 'Top Ads', href: '/dashboard/top-ads', icon: ArrowTrendingUpIcon },
  { name: 'Ads By Type', href: '/dashboard/ads-by-type', icon: DocumentTextIcon },
  { name: 'Best Landing Pages', href: '/dashboard/landing-pages', icon: GlobeAltIcon },
  { name: 'Best Headlines', href: '/dashboard/headlines', icon: DocumentTextIcon },
  { name: 'Best Copy', href: '/dashboard/copy', icon: DocumentTextIcon },
  { name: 'Video Drop-off', href: '/dashboard/video', icon: VideoCameraIcon },
  { name: 'Account Performance', href: '/dashboard/account-performance', icon: ChartBarIcon },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isStarterBoardOpen, setIsStarterBoardOpen] = useState(true);

  const isActive = (href: string) => router.pathname === href;
  const isStarterBoardActive = (href: string) => 
    router.pathname.startsWith('/dashboard/starter') || 
    starterBoardItems.some(item => router.pathname === item.href);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-gray-700 bg-surface">
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded"></div>
            <span className="text-white text-xl font-semibold">AdGenie</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-8">
          {/* Main Navigation */}
          <div className="space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                  isActive(item.href)
                    ? 'bg-gray-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Boards Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Boards
            </h3>
            <div className="space-y-1">
              {/* Starter Board with Dropdown */}
              <div>
                <button
                  onClick={() => setIsStarterBoardOpen(!isStarterBoardOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg ${
                    isStarterBoardActive('/dashboard/starter')
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center">
                    <ChartBarIcon className="h-5 w-5 mr-3" />
                    Starter board
                  </div>
                  <ChevronDownIcon
                    className={`h-4 w-4 transition-transform ${
                      isStarterBoardOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </button>
                {/* Dropdown Items */}
                <div className={`mt-1 ml-4 space-y-1 ${isStarterBoardOpen ? 'block' : 'hidden'}`}>
                  {starterBoardItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                        isActive(item.href)
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Upgrade Banner */}
        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-700">
          <div className="p-4 bg-gray-700 rounded-lg">
            <h3 className="text-sm font-semibold text-white">Upgrade to Professional</h3>
            <p className="mt-1 text-xs text-gray-300">
              Get unlimited reports, multi-account insights, AI breakdowns, and priority support.
            </p>
            <button className="mt-3 w-full px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 via-purple-500 to-blue-500 rounded-lg hover:opacity-90 transition-opacity">
              Start free trial
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
} 