'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTranslation } from '@/lib/translations';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { preferences } = usePreferences();
  const t = useTranslation(preferences.language);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'agent',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }

    if (session.user.role !== 'supervisor') {
      router.push('/dashboard');
      return;
    }

    fetchUsers();
  }, [session, status, router]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setFormErrors({});

    try {
      const method = editingUser ? 'PUT' : 'POST';
      const body = editingUser 
        ? { userId: editingUser._id, ...formData }
        : formData;

      const response = await fetch('/api/users', {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details) {
          const newErrors: Record<string, string> = {};
          data.details.forEach((detail: { path: string[]; message: string }) => {
            newErrors[detail.path[0]] = detail.message;
          });
          setFormErrors(newErrors);
        } else {
          setFormErrors({ general: data.error || 'An error occurred' });
        }
        return;
      }

      // Reset form and refresh users
      setFormData({ name: '', email: '', password: '', role: 'agent' });
      setShowForm(false);
      setEditingUser(null);
      fetchUsers();
    } catch {
      setFormErrors({ general: 'An error occurred while saving the user' });
    } finally {
      setFormLoading(false);
    }
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      const response = await fetch(`/api/users?userId=${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchUsers();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('An error occurred while deleting the user');
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', password: '', role: 'agent' });
    setFormErrors({});
  };

  const getRoleBadge = (role: string) => {
    if (!role) return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">N/A</span>;
    
    const colors = {
      supervisor: 'bg-purple-100 text-purple-800',
      agent: 'bg-blue-100 text-blue-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
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

  if (!session || session.user.role !== 'supervisor') {
    return null;
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('Users')}</h1>
            <p className="text-gray-600">{t('Manage system users and permissions')}</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {t('Add User')}
          </Button>
        </div>

        {/* Add/Edit User Form */}
        {showForm && (
          <Card>
            <CardHeader>
              <CardTitle>{editingUser ? 'Edit User' : 'Add New User'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {formErrors.general && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {formErrors.general}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    value={formData.name}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    error={formErrors.name}
                    placeholder="John Doe"
                    required
                  />

                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    error={formErrors.email}
                    placeholder="john@example.com"
                    required
                  />

                  <Input
                    label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleFormChange('password', e.target.value)}
                    error={formErrors.password}
                    placeholder="Minimum 6 characters"
                    required={!editingUser}
                  />

                  <Select
                    label="Role"
                    value={formData.role}
                    onChange={(e) => handleFormChange('role', e.target.value)}
                    error={formErrors.role}
                    options={[
                      { value: 'agent', label: 'Agent' },
                      { value: 'supervisor', label: 'Supervisor' },
                    ]}
                    required
                  />
                </div>

                <div className="flex gap-4">
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? (editingUser ? 'Updating...' : 'Creating...') : (editingUser ? 'Update User' : 'Create User')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-gray-700"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t('Users')} ({users.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Name')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Created')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('Actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-gray-700"
                            onClick={() => handleEdit(user)}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </Button>
                          {user._id !== session.user.id && (
                            <Button 
                              variant="danger" 
                              size="sm"
                              onClick={() => handleDelete(user._id)}
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
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
