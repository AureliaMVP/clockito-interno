import { Shell } from '../components/ui';
import useSWR from 'swr';
import { API } from '../components/api';
import { useState } from 'react';

const fetcher = (url)=>fetch(url).then(r=>r.json());

export default function Projects(){
  const { data, mutate } = useSWR(`${API}/api/projects`, fetcher);
  const [name, setName] = useState('Nuevo Proyecto');

  const create = async () => {
    await fetch(`${API}/api/projects`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name }) });
    setName('');
    mutate();
  };

  return (
    <Shell>
      <h1 className="text-2xl font-semibold mb-4">Proyectos</h1>
      <div className="bg-white p-4 border rounded mb-4">
        <div className="flex gap-2">
          <input value={name} onChange={e=>setName(e.target.value)} className="border rounded p-2 flex-1" placeholder="Nombre" />
          <button onClick={create} className="px-3 py-2 bg-black text-white rounded">Crear</button>
        </div>
      </div>
      <ul className="bg-white border rounded divide-y">
        {(data||[]).map(p=> (
          <li key={p.id} className="p-3 flex justify-between">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{p.client_name || 'Sin cliente'}</div>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}
