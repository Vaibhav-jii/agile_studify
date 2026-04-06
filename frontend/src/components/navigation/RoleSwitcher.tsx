import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUsers } from '../../services/api';
import { UserCheck } from 'lucide-react';

export function RoleSwitcher() {
  const { user, login } = useAuth();
  const [switching, setSwitching] = useState(false);

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const role = e.target.value as 'admin' | 'teacher' | 'student';
    setSwitching(true);
    try {
      // Fetch real users from the DB and find the one with matching role
      const users = await fetchUsers();
      const matched = users.find(u => u.role === role);
      if (matched) {
        login({
          id: matched.id,
          email: matched.email,
          role: matched.role as any,
          full_name: matched.full_name,
        });
      } else {
        alert(`No seeded ${role} account found in the database. Run: python seed.py`);
      }
    } catch {
      alert('Could not reach backend to switch role. Is the server running?');
    } finally {
      setSwitching(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 glass-card rounded-[var(--radius-lg)] border border-[var(--color-primary-violet)] border-opacity-30">
      <UserCheck size={16} className="text-[var(--color-primary-violet)]" />
      <span className="text-sm font-medium text-[var(--color-text-primary)]">
        {switching ? 'Switching...' : 'Demo Role:'}
      </span>
      <select
        value={user.role}
        onChange={handleRoleChange}
        disabled={switching}
        className="bg-transparent text-sm text-[var(--color-text-secondary)] font-medium outline-none cursor-pointer hover:text-[var(--color-primary-violet)] transition-colors disabled:opacity-50"
      >
        <option value="admin" className="bg-[#1C1628]">Admin</option>
        <option value="teacher" className="bg-[#1C1628]">Teacher</option>
        <option value="student" className="bg-[#1C1628]">Student</option>
      </select>
    </div>
  );
}
