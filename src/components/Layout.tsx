'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import Image from 'next/image';
import {
  HomeIcon,
  PhoneIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);

  if (!session) {
    return null;
  }

  const navigation = [
    { name: t('Dashboard'), href: '/dashboard', icon: HomeIcon },
    { name: t('Calls'), href: '/calls', icon: PhoneIcon },
    { name: t('Users'), href: '/users', icon: UsersIcon, supervisorOnly: true },
    { name: t('Reports'), href: '/reports', icon: ChartBarIcon },
    { name: t('Settings'), href: '/settings', icon: Cog6ToothIcon },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.supervisorOnly || session.user.role === 'supervisor'
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-72 flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-sm">
          <div className="flex h-24 shrink-0 items-center">
            <Image
              src="/konecta-logo.webp"
              alt="Konecta Logo"
              width={200}
              height={75}
              className="h-16 w-auto"
            />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {filteredNavigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold',
                            isActive
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'h-6 w-6 shrink-0',
                              isActive
                                ? 'text-blue-600'
                                : 'text-gray-400 group-hover:text-blue-600'
                            )}
                            aria-hidden="true"
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              <li className="mt-auto">
                <div className="flex items-center gap-x-4 px-2 py-3 text-sm font-semibold leading-6 text-gray-900">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                    <span className="text-blue-600 font-medium">
                      {session.user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="sr-only">Your profile</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{session.user.name}</div>
                    <div className="text-xs text-gray-500 capitalize">
                      {session.user.role}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="w-full text-gray-700"
                >
                  {t('Sign out')}
                </Button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-72">
        <main className="py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
