

import useSWR from 'swr';
import { API } from './api';

const fetcher = (url) => fetch(url).then(r=>r.json());

export function Shell({ children }){
  return (
    <div className="min-h-screen">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto p-4 flex gap-4 items-center">
          <div className="font-bold">Clockito (interno)</div>
          <nav className="flex gap-4 text-sm">
            <a href="/" className="hover:underline">Dashboard</a>
            <a href="/timer" className="hover:underline">Timer</a>
            <a href="/timesheet" className="hover:underline">Timesheet</a>
            <a href="/projects" className="hover:underline">Proyectos</a>
            <a href="/reports" className="hover:underline">Reportes</a>
            <a href="/approvals" className="hover:underline">Aprobaciones</a>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto p-6">{children}</main>
    </div>
  );
}

export function ProjectSelect({ value, onChange }){
  const { data } = useSWR(`${API}/api/projects`, fetcher);
  return (
    <select value={value || ''} onChange={e=>onChange(e.target.value)} className="border rounded p-2">
      <option value="">Sin proyecto</option>
      {data?.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}
    </select>
  );
}
