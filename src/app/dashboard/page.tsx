'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import DashboardCharts from '@/components/charts/DashboardCharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatDuration } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/lib/translations';

interface TopAgent {
  _id: string;
  totalCalls: number;
  completedCalls: number;
  avgDuration: number;
  agent: {
    name: string;
    email: string;
  };
}

interface DashboardStats {
  overview: {
    totalCalls: number;
    completedCalls: number;
    missedCalls: number;
    abandonedCalls: number;
    busyCalls: number;
    avgDuration: number;
    completionRate: number;
  };
  chartData: Array<Record<string, unknown>>;
  topAgents: TopAgent[];
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchStats();
  }, [session, status, router]);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats');
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard stats data:', data);
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">{t('Loading...')}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('Dashboard')}</h1>
          <p className="text-gray-600">
            {(() => {
              const welcomeText = t('welcomeBack') as string;
              if (welcomeText && typeof welcomeText === 'string' && welcomeText.includes('{{name}}')) {
                return welcomeText.replace('{{name}}', session.user.name);
              }
              return `Welcome back, ${session.user.name}`;
            })()}
          </p>
        </div>

        {stats && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('Total Calls')}</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.overview.totalCalls}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('Completed')}</p>
                      <p className="text-2xl font-bold text-green-600">
                        {stats.overview.completedCalls}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('Missed')}</p>
                      <p className="text-2xl font-bold text-red-600">
                        {stats.overview.missedCalls}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{t('Average Duration')}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatDuration(Math.round(stats.overview.avgDuration))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <DashboardCharts
              chartData={stats.chartData}
              overview={stats.overview}
            />

            {/* Top Agents (Supervisor only) */}
            {session.user.role === 'supervisor' && stats.topAgents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t('Top Agents')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.topAgents.map((agent, index) => (
                      <div key={agent._id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                            <span className="text-blue-600 font-medium text-sm">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{agent.agent.name}</div>
                            <div className="text-sm text-gray-500">{agent.agent.email}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{agent.totalCalls} calls</div>
                          <div className="text-sm text-gray-500">
                            {((agent.completedCalls / agent.totalCalls) * 100).toFixed(1)}% completion
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
