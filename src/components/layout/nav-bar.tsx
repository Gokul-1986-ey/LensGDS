'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAssessmentStore } from '@/store/assessment-store';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/workshop', label: 'Workshop' },
  { href: '/simulation', label: 'Simulation' },
  { href: '/export', label: 'Export' },
];

export function NavBar() {
  const pathname = usePathname();
  const assessment = useAssessmentStore((s) => s.assessment);

  return (
    <nav className="border-b bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-lg text-primary">
              VCA Platform
            </Link>
            {assessment?.clientProfile?.name && (
              <span className="text-xs text-muted-foreground border rounded px-2 py-0.5">
                {assessment.clientProfile.name}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const disabled = !assessment && item.href !== '/';
              return (
                <Link
                  key={item.href}
                  href={disabled ? '#' : item.href}
                  className={cn(
                    'px-3 py-2 text-sm rounded-md transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent',
                    disabled && 'pointer-events-none opacity-40'
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
