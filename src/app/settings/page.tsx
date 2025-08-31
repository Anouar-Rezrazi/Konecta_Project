'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import { 
  UserIcon, 
  CogIcon, 
  CheckCircleIcon 
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { preferences, updatePreferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [loading, setLoading] = useState(false);
  const [preferencesLoading, setPreferencesLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    // Initialize profile data from session
    setProfileData(prev => ({
      ...prev,
      name: session.user.name || '',
      email: session.user.email || '',
    }));
  }, [session, status, router]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSaveMessage('');

    // Validate password change
    if (profileData.newPassword) {
      if (profileData.newPassword !== profileData.confirmPassword) {
        setErrors({ confirmPassword: 'Passwords do not match' });
        setLoading(false);
        return;
      }
      if (profileData.newPassword.length < 6) {
        setErrors({ newPassword: 'Password must be at least 6 characters' });
        setLoading(false);
        return;
      }
      if (!profileData.currentPassword) {
        setErrors({ currentPassword: 'Current password is required to change password' });
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          email: profileData.email,
          currentPassword: profileData.currentPassword || undefined,
          newPassword: profileData.newPassword || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
        const newErrors: Record<string, string> = {};
        data.details.forEach((detail: { path: string[]; message: string }) => {
          newErrors[detail.path[0]] = detail.message;
        });
        setErrors(newErrors);
        } else {
          setErrors({ general: data.error || 'An error occurred' });
        }
        return;
      }

      // Update session if name or email changed
      if (profileData.name !== session?.user.name || profileData.email !== session?.user.email) {
        await update({
          name: profileData.name,
          email: profileData.email,
        });
        
        // Force a small delay to ensure session is updated
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Clear password fields
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      setSaveMessage(t('Profile updated successfully!'));
      setTimeout(() => setSaveMessage(''), 3000);

    } catch {
      setErrors({ general: 'An error occurred while updating profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreferencesLoading(true);
    
    try {
      setSaveMessage(t('Preferences saved successfully!'));
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setErrors({ preferences: 'Failed to save preferences' });
    } finally {
      setPreferencesLoading(false);
    }
  };

  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePreferenceChange = (field: string, value: string) => {
    updatePreferences({ [field]: value });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Settings')}</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Success Message */}
        {saveMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2" />
            {saveMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserIcon className="h-5 w-5 mr-2" />
                {t('Profile Information')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileSubmit} className="space-y-4">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.general}
                  </div>
                )}

                <Input
                  label={t('Full Name')}
                  value={profileData.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  error={errors.name}
                  placeholder="Your full name"
                  required
                />

                <Input
                  label={t('Email')}
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  error={errors.email}
                  placeholder="your@email.com"
                  required
                />

                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">{t('Change Password')}</h4>
                  
                  <Input
                    label={t('Current Password')}
                    type="password"
                    value={profileData.currentPassword}
                    onChange={(e) => handleProfileChange('currentPassword', e.target.value)}
                    error={errors.currentPassword}
                    placeholder="Enter current password"
                  />

                  <Input
                    label={t('New Password')}
                    type="password"
                    value={profileData.newPassword}
                    onChange={(e) => handleProfileChange('newPassword', e.target.value)}
                    error={errors.newPassword}
                    placeholder="Enter new password"
                  />

                  <Input
                    label={t('Confirm New Password')}
                    type="password"
                    value={profileData.confirmPassword}
                    onChange={(e) => handleProfileChange('confirmPassword', e.target.value)}
                    error={errors.confirmPassword}
                    placeholder="Confirm new password"
                  />
                </div>

                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : t('Save Profile')}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CogIcon className="h-5 w-5 mr-2" />
                {t('Preferences')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePreferencesSubmit} className="space-y-4">
                {errors.preferences && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {errors.preferences}
                  </div>
                )}

                <Select
                  label={t('Language')}
                  value={preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  options={[
                    { value: 'english', label: t('English') },
                    { value: 'spanish', label: t('Spanish') },
                    { value: 'french', label: t('French') },
                  ]}
                />

                <Select
                  label={t('Timezone')}
                  value={preferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  options={[
                    { value: 'UTC', label: 'UTC' },
                    { value: 'Africa/Casablanca', label: 'Morocco (GMT+1)' },
                    { value: 'Europe/London', label: 'London (GMT)' },
                    { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
                    { value: 'America/New_York', label: 'Eastern Time (GMT-5)' },
                    { value: 'America/Chicago', label: 'Central Time (GMT-6)' },
                    { value: 'America/Los_Angeles', label: 'Pacific Time (GMT-8)' },
                  ]}
                />

                <Button type="submit" disabled={preferencesLoading}>
                  {preferencesLoading ? 'Saving...' : t('Save Preferences')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
