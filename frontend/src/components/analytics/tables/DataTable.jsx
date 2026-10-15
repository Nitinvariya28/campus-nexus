import React from 'react';

/**
 * Standard Reusable Data Table Component
 * Clean corporate styling matching UI/UX design tokens.
 *
 * @param {Array} columns - [{ key, label, render }]
 * @param {Array} data - Array of row objects
 * @param {string} [emptyMessage="No records available."] - Message when data array is empty
 */
export default function DataTable({ columns = [], data = [], emptyMessage = 'No records available.' }) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-600"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {data.map((row, rowIdx) => (
              <tr key={row.id || rowIdx} className="hover:bg-slate-50/80 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 font-medium whitespace-nowrap">
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
