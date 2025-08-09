import { Shell, ProjectSelect } from '../components/ui';
import useSWR from 'swr';
import { API } from '../components/api';
import { useState } from 'react';

const fetcher = (url)=>fetch(url, { headers: { 'x-user-id':'u_lucho' } }).then(r=>r.json());

export default function Timer(){
  const { data: timer, mutate } = useSWR(`${API}/api/timer`, fetcher);
  const [projectId, setProjectId] = useState('');
  const [task, setTask] = useState('');
  const [note, setNote] = useState('');

  const start = async () => {
    await fetch(`${API}/api/timer/start`, {
      method:'POST', headers:{'Content-Type':'application/json','x-user-id':'u_lucho'},
      body: JSON.stringify({ project_id: projectId, task, note })
    });
    mutate();
  };
  const stop = async () => {
    await fetch(`${API}/api/timer/stop`, { method:'POST', headers:{'x-user-id':'u_lucho'} });
    mutate();
  };

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Timer</h1>
      <div className="bg-white p-4 border rounded max-w-xl">
        <div className="mb-2">
          <label className="block text-sm">Proyecto</label>
          <ProjectSelect value={projectId} onChange={setProjectId} />
        </div>
        <div className="mb-2">
          <label className="block text-sm">Tarea</label>
          <input value={task} onChange={e=>setTask(e.target.value)} className="border rounded p-2 w-full" />
        </div>
        <div className="mb-4">
          <label className="block text-sm">Nota</label>
          <textarea value={note} onChange={e=>setNote(e.target.value)} className="border rounded p-2 w-full" />
        </div>
        {!timer && <button onClick={start} className="px-3 py-2 bg-black text-white rounded">Start</button>}
        {timer && <button onClick={stop} className="px-3 py-2 bg-red-600 text-white rounded">Stop</button>}
        <div className="mt-4 text-sm text-gray-600">
          {timer ? `En curso desde ${new Date(timer.start).toLocaleString()}` : 'Sin timer activo'}
        </div>
      </div>
    </Shell>
  );
}
