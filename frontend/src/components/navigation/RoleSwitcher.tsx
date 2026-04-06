import React from 'react';
import { useAuth, User } from '../../context/AuthContext';
import { UserCheck } from 'lucide-react';

export function RoleSwitcher() {
  const { user, login } = useAuth();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as 'admin' | 'teacher' | 'student';
    const newUser: User = {
      id: `demo-${role}-id`,
      email: `${role}@studify.com`,
      role: role,
      full_name: role === 'admin' ? 'Super Admin' : role === 'teacher' ? 'Dr. Demo Teacher' : 'Alex Student'
    };
    login(newUser);
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-[var(--radius-lg)] border border-[var(--color-primary-violet)] border-opacity-30">
      <UserCheck size={16} className="text-[var(--color-primary-violet)]" />
      <span className="text-sm font-medium text-[var(--color-text-primary)]">Demo Role:</span>
      <select 
        value={user.role} 
        onChange={handleRoleChange}
        className="bg-transparent text-sm text-[var(--color-text-secondary)] font-medium outline-none cursor-pointer hover:text-[var(--color-primary-violet)] transition-colors"
      >
        <option value="admin" className="bg-[#1C1628]">Admin</option>
        <option value="teacher" className="bg-[#1C1628]">Teacher</option>
        <option value="student" className="bg-[#1C1628]">Student</option>
      </select>
    </div>
  );
}
