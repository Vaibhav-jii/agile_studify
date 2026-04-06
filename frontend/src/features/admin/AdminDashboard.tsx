import React, { useState, useEffect } from 'react';
import { Card } from '../../components/data-display/Card';
import { Button } from '../../components/form-controls/Button';
import { useToast } from '../../components/feedback/Toast';
import { Shield, UserCog, User, Briefcase } from 'lucide-react';
import { Badge } from '../../components/data-display/Badge';
import { fetchUsers, updateUserRole, type LoginResponse } from '../../services/api';

export function AdminDashboard() {
  const [users, setUsers] = useState<LoginResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers();
      setUsers(data);
    } catch (error: any) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`Role updated to ${newRole}`, 'success');
    } catch (error: any) {
      showToast('Failed to update role', 'error');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={16} className="text-red-500" />;
      case 'teacher': return <Briefcase size={16} className="text-blue-500" />;
      default: return <User size={16} className="text-green-500" />;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
          User Access Management
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Manage system users and their roles (Admin, Teacher, Student).
        </p>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-[var(--color-text-muted)] p-6 text-center">Loading users...</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[var(--color-text-muted)] text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Name</th>
                  <th className="p-4 font-medium">Email</th>
                  <th className="p-4 font-medium">Current Role</th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-4 text-[var(--color-text-primary)] font-medium">
                      {user.full_name || 'N/A'}
                    </td>
                    <td className="p-4 text-[var(--color-text-muted)]">
                      {user.email}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className="capitalize text-[var(--color-text-primary)]">{user.role}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <select 
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className="bg-white/10 border border-white/20 text-[var(--color-text-primary)] rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[var(--color-primary-violet)]"
                      >
                        <option value="student" className="bg-gray-900 text-white">Student</option>
                        <option value="teacher" className="bg-gray-900 text-white">Teacher</option>
                        <option value="admin" className="bg-gray-900 text-white">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
