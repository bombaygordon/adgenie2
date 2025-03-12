import { FC } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  HomeIcon,
  Cog6ToothIcon,
  GiftIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  PhotoIcon,
  VideoCameraIcon,
  ChartPieIcon,
  RectangleGroupIcon
} from '@heroicons/react/24/outline';
import type { ForwardRefExoticComponent, SVGProps, RefAttributes } from 'react';

type IconType = ForwardRefExoticComponent<Omit<SVGProps<SVGSVGElement>, "ref"> & RefAttributes<SVGSVGElement>>;

interface NavigationItem {
  name: string;
  href?: string;
  icon?: IconType;
  type?: 'header';
}

const Sidebar: FC = () => {
  const router = useRouter();
  
  const isActive = (path: string) => router.pathname === path;

  const navigation: NavigationItem[] = [
    { name: 'Home', href: '/', icon: HomeIcon },
    { name: 'Settings', href: '/settings/data-sources', icon: Cog6ToothIcon },
    { name: 'Refer and earn', href: '/refer', icon: GiftIcon },
    {
      name: 'BOARDS',
      type: 'header'
    },
    { name: 'Starter board', href: '/dashboard/starter', icon: ChartBarIcon },
    { name: 'Top Ads', href: '/dashboard/top-ads', icon: ArrowTrendingUpIcon },
    { name: 'Ads By Type', href: '/dashboard/ads-by-type', icon: DocumentTextIcon },
    { name: 'Best Landing Pages', href: '/dashboard/best-landing-pages', icon: PhotoIcon },
    { name: 'Best Headlines', href: '/dashboard/best-headlines', icon: DocumentTextIcon },
    { name: 'Best Copy', href: '/dashboard/best-copy', icon: DocumentTextIcon },
    { name: 'Video Drop-off', href: '/dashboard/video-drop-off', icon: VideoCameraIcon },
    { name: 'Account Performance', href: '/dashboard/account-performance', icon: ChartPieIcon },
    { name: 'Google Ads', href: '/dashboard/google-ads', icon: RectangleGroupIcon },
  ];

  return (
    <div className="flex h-full flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-4">
        <Link href="/" className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded bg-gradient-to-br from-purple-600 to-blue-600"></div>
          <span className="text-xl font-semibold text-white">AdGenie</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          if (item.type === 'header') {
            return (
              <div
                key={item.name}
                className="px-3 pt-5 pb-2 text-xs font-semibold text-gray-400"
              >
                {item.name}
              </div>
            );
          }

          if (!item.href || !item.icon) return null;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium ${
                isActive(item.href)
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon
                className={`mr-3 h-5 w-5 flex-shrink-0 ${
                  isActive(item.href)
                    ? 'text-white'
                    : 'text-gray-400 group-hover:text-white'
                }`}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar; 