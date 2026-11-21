import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Bot, Mic, FileText, Settings, Menu, X } from 'lucide-react';
import { useConfigStore } from '@/store';
import { Badge } from '@/components/ui';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const config = useConfigStore((state) => state.config);
  const isConfigured = Boolean(config?.groqApiKey && config?.jobRole);

  const navLinks = [
    { to: '/', label: 'Overview', icon: Bot },
    { to: '/setup', label: 'Setup', icon: Settings },
    { to: '/interview', label: 'Studio', icon: Mic },
    { to: '/report', label: 'Evaluation', icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-canvas/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-container items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-accent text-white">
            <Bot className="h-4 w-4" />
          </div>
          <span className="font-semibold text-text-primary text-sm tracking-tight">
            Interviewer
          </span>
          <span className="hidden sm:inline-block text-[11px] font-mono text-text-muted px-1.5 py-0.5 rounded border border-border-subtle">
            in-memory
          </span>
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
                  `flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-elevated text-text-primary border border-border-subtle'
                      : 'text-text-muted hover:text-text-primary hover:bg-surface'
                  }`
                }
              >
                <Icon className="h-3.5 w-3.5 text-text-muted" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Status Indicator */}
        <div className="hidden sm:flex items-center gap-2">
          {isConfigured ? (
            <Badge variant="success" className="py-1">
              <span className="max-w-[140px] truncate">{config?.jobRole}</span>
            </Badge>
          ) : (
            <Badge variant="outline" className="py-1">
              Unconfigured
            </Badge>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-text-muted hover:text-text-primary rounded focus-visible:outline-none"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-border-subtle bg-surface px-4 py-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-surface-elevated text-text-primary'
                      : 'text-text-muted hover:text-text-primary'
                  }`
                }
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
          {isConfigured && (
            <div className="pt-2 px-3 border-t border-border-subtle text-xs">
              <span className="text-text-muted">Target role: </span>
              <span className="text-text-primary font-medium">{config?.jobRole}</span>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
