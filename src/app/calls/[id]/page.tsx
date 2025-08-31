'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { formatDuration, formatPhoneNumber } from '@/lib/utils';
import { PencilIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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
  createdAt: string;
  updatedAt: string;
}

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [call, setCall] = useState<Call | null>(null);
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
        alert('You do not have permission to view this call');
        router.push('/calls');
      }
    } catch (error) {
      console.error('Error fetching call:', error);
    } finally {
      setLoading(false);
    }
  }, [resolvedParams, router]);

  useEffect(() => {
    if (status === 'loading' || !resolvedParams) return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    fetchCall();
  }, [session, status, router, resolvedParams, fetchCall]);

  const getStatusBadge = (status: string) => {
    if (!status) return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">N/A</span>;
    
    const colors = {
      completed: 'bg-green-100 text-green-800',
      missed: 'bg-red-100 text-red-800',
      abandoned: 'bg-yellow-100 text-yellow-800',
      busy: 'bg-gray-100 text-gray-800',
    };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/calls" className="no-underline">
              <Button variant="outline" size="sm" className="text-gray-700 border-gray-300 hover:bg-gray-50">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Calls
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Call Details</h1>
              <p className="text-gray-600">View call information and history</p>
            </div>
          </div>
          
          {/* Edit button - only show if user is supervisor or owns the call */}
          {(session.user.role === 'supervisor' || call.agentId._id === session.user.id) && (
            <Link href={`/calls/${resolvedParams.id}/edit`} className="no-underline">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Call
              </Button>
            </Link>
          )}
        </div>

        {/* Call Information */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Call Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone Number</label>
                  <p className="text-sm text-gray-900 font-mono">
                    {formatPhoneNumber(call.phoneNumber)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(call.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm text-gray-900">
                    {formatDuration(call.duration)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date & Time</label>
                  <p className="text-sm text-gray-900">
                    {new Date(call.date).toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <p className="text-sm text-gray-900 mt-1">
                  {call.reason || 'N/A'}
                </p>
              </div>
              
              {call.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Notes</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {call.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Agent Name</label>
                <p className="text-sm text-gray-900">
                  {call.agentId.name}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-sm text-gray-900">
                  {call.agentId.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Agent ID</label>
                <p className="text-sm text-gray-900 font-mono">
                  {call.agentId._id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Record Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Call ID</label>
                <p className="text-sm text-gray-900 font-mono">
                  {call._id}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-sm text-gray-900">
                  {new Date(call.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-sm text-gray-900">
                  {new Date(call.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
