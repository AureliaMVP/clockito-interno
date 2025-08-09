import { Shell } from '../components/ui';
import useSWR from 'swr';
import { API } from '../components/api';

const fetcher = (url)=>fetch(url).then(r=>r.json());

export default function Home(){
  const now = new Date().toLocaleString();
  const { data: summary } = useSWR(`${API}/api/reports/summary?from=&to=&group_by=project`, fetcher);
  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Dashboard</h1>
      <p className="text-sm text-gray-600 mb-6">Ahora: {now}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">Top proyectos por horas</h2>
          <ul className="text-sm">
            {(summary||[]).slice(0,5).map(s=> (
              <li key={s.key} className="flex justify-between border-b py-1">
                <span>{s.key}</span><span>{(s.seconds/3600).toFixed(1)} h</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white p-4 rounded border">
          <h2 className="font-semibold mb-2">Accesos rápidos</h2>
          <div className="flex gap-2">
            <a href="/timer" className="px-3 py-2 border rounded">Ir al Timer</a>
            <a href="/timesheet" className="px-3 py-2 border rounded">Completar Timesheet</a>
            <a href="/projects" className="px-3 py-2 border rounded">Gestionar Proyectos</a>
          </div>
        </div>
      </div>
    </Shell>
  );
}
