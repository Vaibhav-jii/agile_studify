import React, { useState, useEffect } from 'react';
import { User as UserIcon } from 'lucide-react';
import { Card } from '../../components/data-display/Card';
import { Input } from '../../components/form-controls/Input';

import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../services/api';
import { useToast, Toast } from '../../components/feedback/Toast';

export function SettingsView() {
  const { user, updateUser } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    name: user?.full_name || '',
    email: user?.email || '',
  });

  // Sync state if user context updates from somewhere else
  useEffect(() => {
    if (user) {
      setSettings(s => ({ ...s, name: user.full_name || '', email: user.email || '' }));
    }
  }, [user]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (user) {
        // Update user on the backend
        const res = await updateProfile(user.id, { full_name: settings.name, email: settings.email });

        // Update user in local context/storage
        updateUser({ full_name: res.full_name, email: res.email });

        showToast('Profile and settings saved successfully!', 'success');
      }
    } catch (error: any) {
      showToast(error.message || 'Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-500">
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-text-primary)] mb-2">
          Settings
        </h1>
        <p className="text-[var(--color-text-muted)]">
          Customize your study preferences and profile
        </p>
      </div>

      {/* Profile Settings */}
      <Card variant="default" className="animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white">
            <UserIcon size={20} />
          </div>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Profile
          </h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Full Name"
            value={settings.name}
            onChange={(e) => setSettings({ ...settings, name: e.target.value })}
          />
          <Input
            label="Email"
            type="email"
            value={settings.email}
            onChange={(e) => setSettings({ ...settings, email: e.target.value })}
          />
        </div>

        <div className="flex justify-end mt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-lg bg-[var(--color-primary-violet)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </Card>
    </div>
  );
}
