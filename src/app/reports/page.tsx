'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { 
  TableCellsIcon,
  FunnelIcon,
  DocumentIcon 
} from '@heroicons/react/24/outline';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/lib/translations';

interface Call {
  _id: string;
  phoneNumber?: string;
  date?: string;
  duration?: number;
  agentId?: {
    _id: string;
    name: string;
    email: string;
  };
  status?: string;
  reason?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    callType: '',
    priority: '',
    startDate: '',
    endDate: '',
    agent: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  const [agents, setAgents] = useState<Array<{ _id: string; name: string; email: string }>>([]);

  const fetchCalls = useCallback(async () => {
    try {
      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...filters,
        // Map callType to reason for API compatibility
        reason: filters.callType,
      });
      // Remove callType from params since we're using reason
      searchParams.delete('callType');
      searchParams.delete('priority'); // Priority doesn't exist in our model

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
  }, [pagination.page, pagination.limit, filters]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.users.filter((user: { role: string }) => user.role === 'agent'));
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchCalls();
    fetchAgents();
  }, [session, status, router, fetchCalls, fetchAgents]);

  const handleFilterChange = useCallback((field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      status: '',
      callType: '',
      priority: '',
      startDate: '',
      endDate: '',
      agent: '',
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const exportToPDF = useCallback(async () => {
    setExporting(true);
    try {
      // Fetch ALL calls that match the current filters (not just current page)
      const searchParams = new URLSearchParams({
        limit: '1000', // Get all calls
        ...filters,
        // Map callType to reason for API compatibility
        reason: filters.callType,
      });
      // Remove callType from params since we're using reason
      searchParams.delete('callType');
      searchParams.delete('priority'); // Priority doesn't exist in our model

      const callsResponse = await fetch(`/api/calls?${searchParams}`);
      let allCalls = calls; // Default to current calls if fetch fails
      
      if (callsResponse.ok) {
        const callsData = await callsResponse.json();
        allCalls = callsData.calls;
      }

      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calls: allCalls, filters }),
      });

      if (response.ok) {
        const html = await response.text();
        // Open HTML in a new window that can be printed to PDF
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(html);
          newWindow.document.close();
          // Optional: trigger print dialog
          setTimeout(() => {
            newWindow.print();
          }, 500);
        }
      } else {
        alert('Failed to generate PDF report');
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Error generating PDF report');
    } finally {
      setExporting(false);
    }
  }, [filters, calls]);

  const exportToExcel = useCallback(async () => {
    setExporting(true);
    try {
      // Fetch ALL calls that match the current filters (not just current page)
      const searchParams = new URLSearchParams({
        limit: '1000', // Get all calls
        ...filters,
        // Map callType to reason for API compatibility
        reason: filters.callType,
      });
      // Remove callType from params since we're using reason
      searchParams.delete('callType');
      searchParams.delete('priority'); // Priority doesn't exist in our model

      const callsResponse = await fetch(`/api/calls?${searchParams}`);
      let allCalls = calls; // Default to current calls if fetch fails
      
      if (callsResponse.ok) {
        const callsData = await callsResponse.json();
        allCalls = callsData.calls;
      }

      const response = await fetch('/api/reports/excel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calls: allCalls, filters }),
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `calls-report-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to generate CSV report');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      alert('Error generating CSV report');
    } finally {
      setExporting(false);
    }
  }, [filters, calls]);

  const getStatusBadge = (status?: string) => {
    if (!status) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>;
    
    const colors = {
      completed: 'bg-green-100 text-green-800',
      missed: 'bg-red-100 text-red-800',
      abandoned: 'bg-yellow-100 text-yellow-800',
      busy: 'bg-orange-100 text-orange-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };  if (status === 'loading' || loading) {
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('Reports')}</h1>
            <p className="text-gray-600">{t('Generate and export call reports')}</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              onClick={exportToPDF} 
              disabled={exporting || calls.length === 0}
              variant="outline"
              className="text-gray-700"
            >
              <DocumentIcon className="h-4 w-4 mr-2" />
              {t('Export PDF')}
            </Button>
            <Button 
              onClick={exportToExcel} 
              disabled={exporting || calls.length === 0}
            >
              <TableCellsIcon className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'completed', label: 'Completed' },
                  { value: 'missed', label: 'Missed' },
                  { value: 'abandoned', label: 'Abandoned' },
                  { value: 'busy', label: 'Busy' },
                ]}
              />

              <Select
                label="Reason"
                value={filters.callType}
                onChange={(e) => handleFilterChange('callType', e.target.value)}
                options={[
                  { value: '', label: 'All Reasons' },
                  { value: 'support', label: 'Support' },
                  { value: 'sales', label: 'Sales' },
                  { value: 'inquiry', label: 'Inquiry' },
                  { value: 'followup', label: 'Follow-up' },
                ]}
              />

              <Select
                label="Agent"
                value={filters.agent}
                onChange={(e) => handleFilterChange('agent', e.target.value)}
                options={[
                  { value: '', label: 'All Agents' },
                  ...agents.map(agent => ({ value: agent._id, label: agent.name })),
                ]}
              />

              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />

              <Input
                label="End Date"
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
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-900">
                {pagination.total}
              </div>
              <div className="text-sm text-gray-600">Total Calls</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {calls.filter((call: Call) => call.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-red-600">
                {calls.filter((call: Call) => call.status === 'missed').length}
              </div>
              <div className="text-sm text-gray-600">Missed</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {calls.filter((call: Call) => call.status === 'abandoned').length}
              </div>
              <div className="text-sm text-gray-600">Abandoned</div>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Call Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone & Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {calls.map((call) => (
                    <tr key={call._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {call.phoneNumber || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {call.reason || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.reason ? call.reason.charAt(0).toUpperCase() + call.reason.slice(1) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(call.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {call.agentId?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {call.date ? new Date(call.date).toLocaleDateString() : 'N/A'}
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
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page === pagination.pages}
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    className="text-gray-700"
                  >
                    Next
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
