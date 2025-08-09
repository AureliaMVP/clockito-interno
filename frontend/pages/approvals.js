import { Shell } from '../components/ui';
import useSWR from 'swr';
import { API } from '../components/api';

const fetcher = (url)=>fetch(url, { headers:{'x-user-id':'u_admin'} }).then(r=>r.json());

export default function Approvals(){
  const { data: ts, mutate } = useSWR(`${API}/api/timesheets?user_id=u_lucho`, fetcher);
  const approve = async () => {
    await fetch(`${API}/api/approvals/approve`, { method:'POST', headers:{'Content-Type':'application/json','x-user-id':'u_admin'}, body: JSON.stringify({ user_id:'u_lucho', week_start: ts?.week_start }) });
    mutate();
  };
  const reject = async () => {
    await fetch(`${API}/api/approvals/reject`, { method:'POST', headers:{'Content-Type':'application/json','x-user-id':'u_admin'}, body: JSON.stringify({ user_id:'u_lucho', week_start: ts?.week_start, reason:'Faltan horas' }) });
    mutate();
  };
  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Aprobaciones (manager)</h1>
      <div className="bg-white p-4 border rounded">
        <div className="flex gap-2 mb-4">
          <button onClick={approve} className="px-3 py-2 bg-green-600 text-white rounded">Aprobar</button>
          <button onClick={reject} className="px-3 py-2 bg-red-600 text-white rounded">Rechazar</button>
        </div>
        <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">{JSON.stringify(ts, null, 2)}</pre>
      </div>
    </Shell>
  );
}
