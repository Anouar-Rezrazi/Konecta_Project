'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import CallForm from '@/components/forms/CallForm';

export default function NewCallPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [agents, setAgents] = useState([]);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role === 'supervisor') {
      fetchAgents();
    }
  }, [session, status, router]);

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

  const handleSubmit = async (callData: Record<string, unknown>) => {
    const response = await fetch('/api/calls', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(callData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw error;
    }

    router.push('/calls');
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Call</h1>
          <p className="text-gray-600">Create a new call record</p>
        </div>

        <CallForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/calls')}
          agents={agents}
        />
      </div>
    </Layout>
  );
}
