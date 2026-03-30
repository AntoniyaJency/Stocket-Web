'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Bot, History, Settings, TrendingUp, ChartBar as BarChart3, Zap } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Automated Trading', href: '/automated-trading', icon: Zap },
  { name: 'AI Bot', href: '/bot', icon: Bot },
  { name: 'Trade History', href: '/history', icon: History },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 h-full">
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-8">
          <TrendingUp className="w-8 h-8 text-green-500" />
          <h2 className="text-lg font-bold text-white">Stocket Pro</h2>
        </div>
        
        <nav className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-green-500/10 text-green-500 border-l-2 border-green-500'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center">
          <p>Version 1.0.0</p>
          <p>© 2024 Stocket</p>
        </div>
      </div>
    </aside>
  );
}
