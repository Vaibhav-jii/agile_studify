import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, BookOpenCheck, Shield, LogOut } from 'lucide-react';

const roleConfig = {
  student: { label: 'Student', icon: GraduationCap, color: '#9B7CFF' },
  teacher: { label: 'Teacher', icon: BookOpenCheck, color: '#FFABE1' },
  admin:   { label: 'Admin',   icon: Shield,        color: '#5AC8FA' },
};

export function RoleSwitcher() {
  const { user, logout } = useAuth();

  if (!user) return null;

  const config = roleConfig[user.role] || roleConfig.student;
  const Icon = config.icon;

  return (
    <div className="flex flex-col gap-2">
      {/* Role Badge (read-only) */}
      <div
        className="flex items-center gap-2 px-4 py-2.5 glass-card rounded-[var(--radius-lg)] border border-opacity-30"
        style={{ borderColor: config.color }}
      >
        <Icon size={16} style={{ color: config.color }} />
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-xs text-[var(--color-text-muted)] leading-none">Logged in as</span>
          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
            {user.full_name || user.email}
          </span>
        </div>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `${config.color}22`, color: config.color }}
        >
          {config.label}
        </span>
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)]
          text-sm font-medium text-[var(--color-text-muted)]
          hover:bg-red-500/10 hover:text-red-400
          transition-all duration-200"
      >
        <LogOut size={16} />
        <span>Log out</span>
      </button>
    </div>
  );
}
