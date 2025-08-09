import { Shell, ProjectSelect } from '../components/ui';
import useSWR from 'swr';
import { API } from '../components/api';
import { useState } from 'react';

const fetcher = (url)=>fetch(url, { headers: { 'x-user-id':'u_lucho' } }).then(r=>r.json());

export default function Timesheet(){
  const { data: ts, mutate } = useSWR(`${API}/api/timesheets?user_id=u_lucho`, fetcher);
  const [hours, setHours] = useState(1);
  const [projectId, setProjectId] = useState('');
  const add = async () => {
    const start = new Date().toISOString();
    const end = new Date(Date.now()+hours*3600*1000).toISOString();
    await fetch(`${API}/api/time-entries`, {
      method:'POST', headers:{'Content-Type':'application/json','x-user-id':'u_lucho'},
      body: JSON.stringify({ project_id: projectId, start, end, note:'Carga manual' })
    });
    mutate();
  };
  const submit = async () => {
    await fetch(`${API}/api/timesheets/submit`, { method:'POST', headers:{'Content-Type':'application/json','x-user-id':'u_lucho'}, body: JSON.stringify({ user_id:'u_lucho', week_start: ts?.week_start }) });
    mutate();
  };
  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Timesheet</h1>
      <div className="bg-white p-4 border rounded mb-4">
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-sm">Proyecto</label>
            <ProjectSelect value={projectId} onChange={setProjectId} />
          </div>
          <div>
            <label className="block text-sm">Horas</label>
            <input type="number" min="0.25" step="0.25" value={hours} onChange={e=>setHours(parseFloat(e.target.value))} className="border rounded p-2 w-28" />
          </div>
          <button onClick={add} className="px-3 py-2 bg-black text-white rounded">Agregar</button>
          <button onClick={submit} className="px-3 py-2 bg-blue-600 text-white rounded">Enviar semana</button>
        </div>
      </div>
      <div className="bg-white p-4 border rounded">
        <div className="flex justify-between mb-2">
          <div>Semana que inicia: <b>{ts?.week_start}</b></div>
          <div>Estado: <b>{ts?.status}</b></div>
          <div>Total: <b>{(ts?.total_seconds/3600).toFixed(2)} h</b></div>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b">
              <th className="py-2">Fecha</th><th>Proyecto</th><th>Horas</th><th>Nota</th>
            </tr>
          </thead>
          <tbody>
            {(ts?.entries||[]).map(e=>(
              <tr key={e.id} className="border-b">
                <td className="py-2">{new Date(e.start).toLocaleString()}</td>
                <td>{e.project_name || '-'}</td>
                <td>{((e.duration_seconds||0)/3600).toFixed(2)}</td>
                <td>{e.note||''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Shell>
  );
}
