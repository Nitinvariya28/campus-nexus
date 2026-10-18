import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Compass, GraduationCap } from 'lucide-react';
import ChartCard from '../ChartCard';
import ChartEmptyState from '../ChartEmptyState';

const DEPT_ABBR = {
  'Computer Science & Engineering': 'CSE',
  'Artificial Intelligence & Data Science': 'AI & DS',
  'Information Technology': 'IT',
  'Electronics & Communication Engineering': 'ECE',
  'Electrical Engineering': 'EE',
  'Mechanical Engineering': 'ME',
  'Civil Engineering': 'CE',
};

const CATEGORY_LABEL_MAP = {
  SOFTWARE: 'Software',
  DEVOPS_CLOUD: 'DevOps',
  DATA_SCIENCE: 'Data Science',
  PRODUCT_MANAGEMENT: 'Product',
  SECURITY: 'Security',
};

/**
 * AlumniDepartmentCareerAlignmentChart Component (Visual 8 - Row 5 Col 2)
 * Stacked / Grouped bar chart revealing academic department career pathway alignment.
 * Strictly consumes live API data from data.alumni.career_paths.cross_associations.job_categories_by_department.
 *
 * @param {object} data - Aggregated dashboard payload
 * @param {boolean} loading - Loading indicator
 */
export default function AlumniDepartmentCareerAlignmentChart({ data, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between h-[380px] animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-48 bg-slate-200 rounded" />
          <div className="h-3 w-64 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3 my-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="h-3 w-16 bg-slate-200 rounded" />
              <div className="h-4 bg-slate-100 rounded flex-1" />
            </div>
          ))}
        </div>
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    );
  }

  const rawDepts =
    data?.alumni?.career_paths?.cross_associations?.job_categories_by_department || [];

  if (!rawDepts || rawDepts.length === 0) {
    return (
      <ChartCard
        title="Department Career Alignment"
        subtitle="Academic department to career specialization mapping"
        heightClass="h-[380px]"
      >
        <ChartEmptyState
          title="Alignment Data Unavailable"
          message="Technical issue: Department career alignment cross-association data is not available."
        />
      </ChartCard>
    );
  }

  const chartData = rawDepts.slice(0, 5).map((item) => {
    const fullName = item.department__name || 'Unknown';
    const shortName = DEPT_ABBR[fullName] || fullName.split(' ')[0];

    const row = {
      fullName,
      dept: shortName,
      Software: 0,
      DevOps: 0,
      'Data Science': 0,
      Product: 0,
      Security: 0,
    };

    (item.categories || []).forEach((cat) => {
      const label = CATEGORY_LABEL_MAP[cat.job_category];
      if (label && row[label] !== undefined) {
        row[label] = Number(cat.count) || 0;
      }
    });

    return row;
  });

  return (
    <ChartCard
      title="Department Career Alignment"
      subtitle="How engineering departments map to career disciplines"
      heightClass="h-auto"
      actionSlot={
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-teal-50 text-teal-700 border border-teal-200">
          <Compass className="w-3 h-3 text-teal-600" />
          {chartData.length} Departments
        </span>
      }
    >
      <div className="flex flex-col gap-3">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              barSize={16}
              maxBarSize={18}
              margin={{ top: 8, right: 25, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
              <XAxis
                type="number"
                tick={{ fill: '#64748B', fontSize: 11 }}
                axisLine={{ stroke: '#E2E8F0' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="dept"
                tick={{ fill: '#334155', fontSize: 11, fontWeight: 600 }}
                axisLine={false}
                tickLine={false}
                width={55}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const item = payload[0].payload;
                  return (
                    <div className="bg-white/95 backdrop-blur-xs border border-slate-200 shadow-md rounded-lg p-2.5 text-xs">
                      <div className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
                        {item.fullName}
                      </div>
                      <div className="space-y-1">
                        {payload.map((entry, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-4">
                            <span className="flex items-center gap-1 text-slate-600">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              {entry.name}:
                            </span>
                            <span className="font-semibold text-slate-900">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconSize={8}
                wrapperStyle={{ fontSize: 11, paddingBottom: 6 }}
              />
              <Bar dataKey="Software" stackId="a" fill="#3B82F6" />
              <Bar dataKey="DevOps" stackId="a" fill="#6366F1" />
              <Bar dataKey="Data Science" stackId="a" fill="#10B981" />
              <Bar dataKey="Product" stackId="a" fill="#F59E0B" />
              <Bar dataKey="Security" stackId="a" fill="#EF4444" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Insight */}
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Multi-disciplinary placement across all engineering branches.</span>
          </div>
          <span className="text-[10px] text-slate-400">By Department</span>
        </div>
      </div>
    </ChartCard>
  );
}
