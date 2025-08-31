'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/lib/translations';

interface CallData {
  phoneNumber: string;
  date: string;
  duration: string;
  agentId: string;
  status: string;
  reason: string;
  notes: string;
}

interface CallFormProps {
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
  agents?: Array<{ _id: string; name: string }>;
}

export default function CallForm({ initialData, onSubmit, onCancel, agents = [] }: CallFormProps) {
  const { data: session } = useSession();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const statusOptions = [
    { value: 'completed', label: t('Completed') },
    { value: 'missed', label: t('Missed') },
    { value: 'abandoned', label: t('Abandoned') },
    { value: 'busy', label: t('Busy') },
  ];

  const [formData, setFormData] = useState<CallData>({
    phoneNumber: (initialData?.phoneNumber as string) || '',
    date: initialData?.date ? new Date(initialData.date as string).toISOString().slice(0, 16) : '',
    duration: (initialData?.duration as string) || '',
    agentId: (initialData?.agentId as { _id: string })?._id || session?.user.id || '',
    status: (initialData?.status as string) || 'completed',
    reason: (initialData?.reason as string) || '',
    notes: (initialData?.notes as string) || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      await onSubmit({
        ...formData,
        date: new Date(formData.date).toISOString(),
        duration: parseInt(formData.duration),
      });
    } catch (error: unknown) {
      const err = error as { details?: Array<{ path: string[]; message: string }>; message?: string };
      if (err.details) {
        const newErrors: Record<string, string> = {};
        err.details.forEach((detail) => {
          newErrors[detail.path[0]] = detail.message;
        });
        setErrors(newErrors);
      } else {
        setErrors({ general: err.message || 'An error occurred' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>
          {initialData ? 'Edit Call' : 'Add New Call'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <Input
            label={t('Phone Number')}
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
            error={errors.phoneNumber}
            placeholder="+212 6XX-XX-XX-XX"
            required
          />

          <Input
            label={t('Date & Time')}
            type="datetime-local"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            error={errors.date}
            required
          />

          <Input
            label={t('Duration (seconds)')}
            type="number"
            min="0"
            value={formData.duration}
            onChange={(e) => handleChange('duration', e.target.value)}
            error={errors.duration}
            placeholder="300"
            required
          />

          {session?.user.role === 'supervisor' && (
            <Select
              label="Agent"
              value={formData.agentId}
              onChange={(e) => handleChange('agentId', e.target.value)}
              error={errors.agentId}
              options={agents.map(agent => ({
                value: agent._id,
                label: agent.name,
              }))}
              required
            />
          )}

          <Select
            label="Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            error={errors.status}
            options={statusOptions}
            required
          />

          <Input
            label="Reason"
            value={formData.reason}
            onChange={(e) => handleChange('reason', e.target.value)}
            error={errors.reason}
            placeholder="Customer inquiry, support request, etc."
            required
          />

          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Additional notes about the call..."
            />
            {errors.notes && (
              <p className="text-sm text-red-600">{errors.notes}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (initialData ? 'Update Call' : 'Add Call')}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="text-gray-700">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
