import { Shell } from '../components/ui';
import useSWR from 'swr';
import { API } from '../components/api';
import { useState } from 'react';

const fetcher = (url) => fetch(url).then(r => r.json());

export default function Reports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState('project');
  const { data } = useSWR(
    `${API}/api/reports/summary?from=${from}&to=${to}&group_by=${groupBy}`,
    fetcher
  );
  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Reportes</h1>
      <div className="bg-white p-4 border rounded mb-4 flex gap-3 items-end">
        <div>
          <label className="block text-sm">Desde</label>
          <input
            type="datetime-local"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm">Hasta</label>
          <input
            type="datetime-local"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="border rounded p-2"
          />
        </div>
        <div>
          <label className="block text-sm">Agrupar por</label>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="border rounded p-2"
          >
            <option value="project">Proyecto</option>
            <option value="user">Usuario</option>
          </select>
        </div>
      </div>
      <table className="w-full bg-white border rounded text-sm">
        <thead>
          <tr className="text-left border-b">
            <th className="py-2">Clave</th>
            <th>Horas</th>
            <th># entradas</th>
          </tr>
        </thead>
        <tbody>
          {(data || []).map((row) => (
            <tr key={row.key} className="border-b">
              <td className="py-2">{row.key}</td>
              <td>{(row.seconds / 3600).toFixed(2)}</td>
              <td>{row.entries}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Shell>
  );
}
