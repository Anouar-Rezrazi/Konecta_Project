import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth-config';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { calls, filters } = await request.json();

    // Generate HTML content for a printable report
    const htmlContent = generatePDFHTML(calls, filters || {});

    // Return HTML that can be printed to PDF by the browser
    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="calls-report-${new Date().toISOString().split('T')[0]}.html"`,
      },
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
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

interface FilterData {
  [key: string]: string;
}

function generatePDFHTML(calls: CallData[], filters: FilterData) {
  const appliedFilters = Object.entries(filters)
    .filter(([, value]) => value && value !== '')
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Call Center Report</title>
      <meta charset="utf-8">
      <style>
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          font-size: 12px;
          line-height: 1.4;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-top: 20px; 
          font-size: 11px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 6px; 
          text-align: left; 
          word-wrap: break-word;
        }
        th { 
          background-color: #f2f2f2; 
          font-weight: bold;
        }
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #007cba;
          padding-bottom: 15px;
        }
        .konecta-logo {
          margin-bottom: 15px;
        }
        .konecta-logo svg {
          max-height: 50px;
        }
        .filters { 
          margin-bottom: 20px; 
          padding: 10px;
          background-color: #f9f9f9;
          border-radius: 5px;
        }
        .summary {
          margin-top: 20px;
          padding: 10px;
          background-color: #f0f8ff;
          border-radius: 5px;
        }
        .print-button {
          margin: 20px 0;
          text-align: center;
        }
        button {
          background-color: #007cba;
          color: white;
          border: none;
          padding: 10px 20px;
          cursor: pointer;
          border-radius: 5px;
          font-size: 14px;
        }
        button:hover {
          background-color: #005a8b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="konecta-logo">${getKonectaLogoSVG()}</div>
        <h1>Call Center Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
      
      <div class="print-button no-print">
        <button onclick="window.print()">🖨️ Print Report</button>
        <button onclick="window.close()" style="background-color: #6c757d; margin-left: 10px;">❌ Close</button>
      </div>
      
      ${appliedFilters ? `<div class="filters"><strong>Applied Filters:</strong> ${appliedFilters}</div>` : ''}
      
      <table>
        <thead>
          <tr>
            <th style="width: 15%;">Phone Number</th>
            <th style="width: 12%;">Reason</th>
            <th style="width: 10%;">Status</th>
            <th style="width: 8%;">Duration</th>
            <th style="width: 15%;">Agent</th>
            <th style="width: 12%;">Date</th>
            <th style="width: 28%;">Notes</th>
          </tr>
        </thead>
        <tbody>
          ${calls.map(call => `
            <tr>
              <td>${call.phoneNumber || 'N/A'}</td>
              <td>${call.reason || 'N/A'}</td>
              <td><span style="padding: 2px 6px; border-radius: 3px; background-color: ${getStatusColor(call.status)}; color: white; font-size: 10px;">${call.status || 'N/A'}</span></td>
              <td>${call.duration ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : 'N/A'}</td>
              <td>${call.agentId?.name || 'N/A'}</td>
              <td>${call.date ? new Date(call.date).toLocaleDateString() : 'N/A'}</td>
              <td>${call.notes || ''}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="summary">
        <h3>Summary</h3>
        <p><strong>Total Records:</strong> ${calls.length}</p>
        <p><strong>Completed Calls:</strong> ${calls.filter(call => call.status === 'completed').length}</p>
        <p><strong>Missed Calls:</strong> ${calls.filter(call => call.status === 'missed').length}</p>
        <p><strong>Abandoned Calls:</strong> ${calls.filter(call => call.status === 'abandoned').length}</p>
        <p><strong>Busy Calls:</strong> ${calls.filter(call => call.status === 'busy').length}</p>
      </div>
    </body>
    </html>
  `;
}

function getStatusColor(status?: string): string {
  const colors = {
    completed: '#10b981',
    missed: '#ef4444', 
    abandoned: '#f59e0b',
    busy: '#6b7280',
  };
  return colors[status as keyof typeof colors] || '#6b7280';
}

function getKonectaLogoSVG(): string {
  return `<svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
    <rect width="120" height="40" fill="#007cba" rx="4"/>
    <text x="60" y="26" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold" letter-spacing="1px">KONECTA</text>
  </svg>`;
}
