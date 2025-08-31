'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatDuration, formatPhoneNumber } from '@/lib/utils';
import { PlusIcon, EyeIcon, PencilIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/lib/translations';

interface Call {
  _id: string;
  phoneNumber: string;
  date: string;
  duration: number;
  agentId: {
    _id: string;
    name: string;
    email: string;
  };
  status: string;
  reason: string;
  notes?: string;
}

export default function CallsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [calls, setCalls] = useState<Call[]>([]);
  const [agents, setAgents] = useState<Array<{ _id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    agent: '',
    status: '',
    reason: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const statusOptions = [
    { value: '', label: t('All Status') },
    { value: 'completed', label: t('Completed') },
    { value: 'missed', label: t('Missed') },
    { value: 'abandoned', label: t('Abandoned') },
    { value: 'busy', label: t('Busy') },
  ];

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchCalls();
    if (session.user.role === 'supervisor') {
      fetchAgents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status, router, filters, pagination.page]); // fetchCalls is called directly

  const fetchCalls = async () => {
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
      });

      const response = await fetch(`/api/calls?${searchParams}`);
      if (response.ok) {
        const data = await response.json();
        setCalls(data.calls);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Error fetching calls:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await fetch('/api/users?role=agent');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.users);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleDeleteCall = async (callId: string) => {
    if (!confirm('Are you sure you want to delete this call?')) return;

    try {
      const response = await fetch(`/api/calls/${callId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCalls();
      } else {
        alert(t('failedToDeleteCall'));
      }
    } catch (error) {
      console.error('Error deleting call:', error);
      alert(t('errorDeletingCall'));
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      agent: '',
      status: '',
      reason: '',
      startDate: '',
      endDate: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>;
    
    const colors = {
      completed: 'bg-green-100 text-green-800',
      missed: 'bg-red-100 text-red-800',
      abandoned: 'bg-yellow-100 text-yellow-800',
      busy: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {t(status.charAt(0).toUpperCase() + status.slice(1))}
      </span>
    );
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
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('Calls')}</h1>
            <p className="text-gray-600">{t('Manage and track all call records')}</p>
          </div>
          <Link href="/calls/new">
            <Button>
              <PlusIcon className="h-4 w-4 mr-2" />
              {t('Add Call')}
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              {t('Filters')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {session.user.role === 'supervisor' && (
                <Select
                  label={t('Agent')}
                  value={filters.agent}
                  onChange={(e) => handleFilterChange('agent', e.target.value)}
                  options={[
                    { value: '', label: t('All Agents') },
                    ...agents.map(agent => ({
                      value: agent._id,
                      label: agent.name,
                    })),
                  ]}
                />
              )}
              
              <Select
                label={t('Status')}
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={statusOptions}
              />

              <Select
                label={t('Reason')}
                value={filters.reason}
                onChange={(e) => handleFilterChange('reason', e.target.value)}
                options={[
                  { value: '', label: t('All Reasons') },
                  { value: 'support', label: 'Support' },
                  { value: 'sales', label: 'Sales' },
                  { value: 'inquiry', label: 'Inquiry' },
                  { value: 'followup', label: 'Follow-up' },
                ]}
              />

              <Input
                label={t('Start Date')}
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />

              <Input
                label={t('End Date')}
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {t('Showing')} {calls.length} {t('of')} {pagination.total} {t('calls')}
              </div>
              <Button variant="outline" onClick={clearFilters} className="text-gray-700">
                {t('Clear Filters')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Calls Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Call Records')} ({pagination.total})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Phone Number')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Duration')}
                    </th>
                    {session.user.role === 'supervisor' && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('Agent')}
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Status')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Reason')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatPhoneNumber(call.phoneNumber)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(call.date).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(call.duration)}
                      </td>
                      {session.user.role === 'supervisor' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {call.agentId.name}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(call.status)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {call.reason}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Link href={`/calls/${call._id}`} className="no-underline">
                            <Button variant="outline" size="sm" className="text-gray-700">
                              <EyeIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/calls/${call._id}/edit`} className="no-underline">
                            <Button variant="outline" size="sm" className="text-gray-700">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                          </Link>
                          {session.user.role === 'supervisor' && (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteCall(call._id)}
                            >
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  {((t('showingXToYOfZResults') as string) || 'Showing {{start}} to {{end}} of {{total}} results')
                    .replace('{{start}}', String((pagination.page - 1) * pagination.limit + 1))
                    .replace('{{end}}', String(Math.min(pagination.page * pagination.limit, pagination.total)))
                    .replace('{{total}}', String(pagination.total))}
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    className="text-gray-700"
                  >
                    {t('Previous')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="text-gray-700"
                  >
                    {t('Next')}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
