import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { calls } = await request.json();

    // Create CSV content with BOM for better Excel compatibility
    const csvContent = '\uFEFF' + generateCSV(calls); // Adding BOM
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="calls-report-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });

  } catch (error) {
    console.error('Error generating Excel:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

interface CallData {
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

function generateCSV(calls: CallData[]) {
  const headers = [
    'Call ID',
    'Agent First Name',
    'Agent Last Name', 
    'Company',
    'Agent Email',
    'Phone Number',
    'Contact Person',
    'Call Reason',
    'Status',
    'Call Date',
    'Start Time',
    'End Time',
    'Duration',
    'Reference Code',
    'Handled By',
    'Notes'
  ];

  const csvRows = [
    headers.join(','),
    ...calls.map((call, index) => {
      const agentName = call.agentId?.name || 'Unknown Agent';
      const nameParts = agentName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      return [
        escapeCSV(call._id || `CALL-${index + 1}`),
        escapeCSV(firstName),
        escapeCSV(lastName),
        escapeCSV('Call Center Corp'),
        escapeCSV(call.agentId?.email || ''),
        escapeCSV(formatPhoneNumber(call.phoneNumber || '')),
        escapeCSV('Customer'),
        escapeCSV(capitalize(call.reason || 'General Inquiry')),
        escapeCSV(capitalize(call.status || 'Unknown')),
        escapeCSV(call.date ? formatDateOnly(call.date) : ''),
        escapeCSV(call.date ? formatTimeOnly(call.date) : ''),
        escapeCSV(call.date ? formatEndTime(call.date, call.duration || 0) : ''),
        escapeCSV(formatDurationClear(call.duration || 0)),
        escapeCSV(generateReferenceCode()),
        escapeCSV(agentName),
        escapeCSV(call.notes || '')
      ].join(',');
    })
  ];

  return csvRows.join('\n');
}

function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  // Format phone number with proper spacing
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function formatDateOnly(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return '';
  }
}

function formatTimeOnly(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
}

function formatEndTime(startDateString: string, durationSeconds: number): string {
  try {
    const startDate = new Date(startDateString);
    const endDate = new Date(startDate.getTime() + (durationSeconds * 1000));
    return endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return '';
  }
}

function formatDurationClear(duration: number): string {
  if (!duration) return '0m 0s';
  const hours = Math.floor(duration / 3600);
  const minutes = Math.floor((duration % 3600) / 60);
  const seconds = duration % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function generateReferenceCode(): string {
  // Generate a reference code like REF-ABC123
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'REF-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function capitalize(str: string): string {
  if (!str) return 'N/A';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function escapeCSV(field: string): string {
  if (field === null || field === undefined) {
    return '';
  }
  
  // Convert to string and trim whitespace
  const stringField = String(field).trim();
  
  // Always wrap in quotes for consistent formatting and to handle commas, quotes, and newlines
  return `"${stringField.replace(/"/g, '""')}"`;
}
