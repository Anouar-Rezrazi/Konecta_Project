'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import CallForm from '@/components/forms/CallForm';

export default function EditCallPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [call, setCall] = useState(null);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  const fetchCall = useCallback(async () => {
    if (!resolvedParams) return;
    
    try {
      const response = await fetch(`/api/calls/${resolvedParams.id}`);
      if (response.ok) {
        const data = await response.json();
        setCall(data);
      } else if (response.status === 404) {
        router.push('/calls');
      } else if (response.status === 403) {
        alert('You do not have permission to edit this call');
        router.push('/calls');
      }
    } catch (error) {
      console.error('Error fetching call:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams, router]);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await fetch('/api/users?role=agent');
      if (response.ok) {
        const data = await response.json();
        setAgents(data.users);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading' || !resolvedParams) return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchCall();
    if (session.user.role === 'supervisor') {
      fetchAgents();
    }
  }, [session, status, router, resolvedParams, fetchCall, fetchAgents]);

  const handleSubmit = async (callData: Record<string, unknown>) => {
    if (!resolvedParams) return;
    
    const response = await fetch(`/api/calls/${resolvedParams.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    router.push(`/calls/${resolvedParams.id}`);
  };

  if (status === 'loading' || loading || !resolvedParams) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!session || !call) {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Call</h1>
          <p className="text-gray-600">Update call information</p>
        </div>

        <CallForm
          initialData={call}
          onSubmit={handleSubmit}
          onCancel={() => router.push(`/calls/${resolvedParams.id}`)}
          agents={agents}
        />
      </div>
    </Layout>
  );
}
