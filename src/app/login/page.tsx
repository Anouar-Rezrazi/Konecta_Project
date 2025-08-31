'use client';

import { useState } from 'react';
import { signIn, getSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/lib/translations';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t('invalidCredentials'));
      } else {
        // Refresh session and redirect
        await getSession();
        router.push('/dashboard');
      }
    } catch {
      setError(t('errorOccurredLogin'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/konecta-logo.webp"
              alt="Konecta Logo"
              width={180}
              height={60}
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('callCenterManager')}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('signInToAccount')}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('signIn')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <Input
                label={t('Email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('enterEmail')}
                required
              />

              <Input
                label={t('Password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('enterPassword')}
                required
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? t('Loading...') : t('signIn')}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <div className="text-sm text-gray-600">
                Demo accounts:
              </div>
              <div className="mt-2 text-xs text-gray-500 space-y-1">
                <div>Supervisor: supervisor@demo.com / password123</div>
                <div>Agent: agent@demo.com / password123</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
