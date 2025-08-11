"use client";
import { useState } from 'react';
import { PlatformClient } from '@platform/sdk';

export default function NewProjectPage() {
  const client = new PlatformClient({ baseUrl: '/api' });
  const [name, setName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [runtimeType, setRuntimeType] = useState<'static'|'edge'|'container'>('static');
  const [region, setRegion] = useState('us-east-1');

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">New Project</h1>
      <div className="space-y-2">
        <input className="border px-2 py-1 w-96" placeholder="Name" value={name} onChange={(e)=>setName(e.target.value)} />
        <input className="border px-2 py-1 w-96" placeholder="Org ID" value={orgId} onChange={(e)=>setOrgId(e.target.value)} />
        <select className="border px-2 py-1 w-96" value={runtimeType} onChange={(e)=>setRuntimeType(e.target.value as any)}>
          <option value="static">static</option>
          <option value="edge">edge</option>
          <option value="container">container</option>
        </select>
        <input className="border px-2 py-1 w-96" placeholder="Region" value={region} onChange={(e)=>setRegion(e.target.value)} />
      </div>
      <button className="border px-3 py-1" onClick={async ()=>{
        await client.createProject({ name, orgId, runtimeType, region });
        window.location.href = '/projects';
      }}>Create</button>
    </div>
  );
}
