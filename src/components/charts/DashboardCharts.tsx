'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

interface DashboardChartsProps {
  chartData: Array<Record<string, unknown>>;
  overview: {
    totalCalls: number;
    completedCalls: number;
    missedCalls: number;
    abandonedCalls: number;
    busyCalls: number;
  };
}

const COLORS = {
  completed: '#10b981',
  missed: '#ef4444',
  abandoned: '#f59e0b',
  busy: '#6b7280',
};

export default function DashboardCharts({ chartData, overview }: DashboardChartsProps) {
  console.log('DashboardCharts received:', { chartData, overview });
  
  const pieData = [
    { name: 'Completed', value: overview.completedCalls, color: COLORS.completed },
    { name: 'Missed', value: overview.missedCalls, color: COLORS.missed },
    { name: 'Abandoned', value: overview.abandonedCalls, color: COLORS.abandoned },
    { name: 'Busy', value: overview.busyCalls, color: COLORS.busy },
  ].filter(item => item.value > 0);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Daily Call Volume
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available for charts
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Call Status Distribution
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '6px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Call Trends
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            No data available for trends
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Daily Calls Bar Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Call Volume
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Bar dataKey="completed" fill={COLORS.completed} name="Completed" />
              <Bar dataKey="missed" fill={COLORS.missed} name="Missed" />
              <Bar dataKey="abandoned" fill={COLORS.abandoned} name="Abandoned" />
              <Bar dataKey="busy" fill={COLORS.busy} name="Busy" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Call Status Distribution Pie Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Call Status Distribution
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Call Trends Line Chart */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 lg:col-span-2">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Call Trends
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="total" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Total Calls"
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke={COLORS.completed} 
                strokeWidth={2}
                name="Completed"
              />
              <Line 
                type="monotone" 
                dataKey="missed" 
                stroke={COLORS.missed} 
                strokeWidth={2}
                name="Missed"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
