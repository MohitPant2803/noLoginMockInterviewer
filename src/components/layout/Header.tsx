import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Bot, Mic, FileText, Settings, Menu, X, ShieldAlert } from 'lucide-react';
import { useConfigStore } from '@/store';
import { Badge } from '@/components/ui';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = useConfigStore((state) => state.config);
  const isConfigured = Boolean(config?.groqApiKey && config?.jobRole);

  const navLinks = [
    { to: '/', label: 'Home', icon: Bot },
    { to: '/setup', label: 'Setup', icon: Settings },
    { to: '/interview', label: 'Interview Room', icon: Mic },
    { to: '/report', label: 'Report', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 shadow-sm shadow-indigo-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-100 tracking-tight text-base sm:text-lg">
              AI Mock Interview
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
              Browser-Direct
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Status / Session Indicator */}
        <div className="hidden sm:flex items-center gap-3">
          {isConfigured ? (
            <Badge variant="success" className="gap-1.5 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="max-w-[130px] truncate">{config?.jobRole}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-slate-400 py-1">
              <ShieldAlert className="h-3.5 w-3.5 text-slate-500" />
              Not Configured
            </Badge>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-400 hover:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-indigo-400'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </NavLink>
            );
          })}
          {isConfigured && (
            <div className="pt-2 px-3 border-t border-slate-900">
              <p className="text-xs text-slate-500">Configured Role:</p>
              <p className="text-sm font-medium text-emerald-400 truncate">{config?.jobRole}</p>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
