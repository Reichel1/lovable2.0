'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlatformClient } from '@platform/sdk';

export default function DomainsPage() {
  const client = new PlatformClient({ baseUrl: '/api' });
  const [projectId, setProjectId] = useState<string>('');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['domains', projectId],
    queryFn: () => client.listDomains(projectId),
    enabled: !!projectId,
  });
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Domains</h1>
      <div className="space-x-2">
        <input className="border px-2 py-1" placeholder="Project ID" value={projectId} onChange={(e)=>setProjectId(e.target.value)} />
        <button className="border px-2 py-1" onClick={()=>refetch()}>Load</button>
      </div>
      {!projectId ? <div>Enter a project ID to view domains.</div> : isLoading ? <div>Loading…</div> : (
        <table className="w-full text-sm">
          <thead><tr className="text-left"><th>Hostname</th><th>Status</th><th>CNAME</th><th>Actions</th></tr></thead>
          <tbody>
            {data?.map((d: any) => (
              <tr key={d.id} className="border-t">
                <td>{d.hostname}</td>
                <td>{d.verificationStatus}</td>
                <td className="font-mono text-xs">{d.verificationCname || '—'}</td>
                <td>
                  <button className="px-2 py-1 border rounded" onClick={() => client.verifyDomain(d.id).then(()=>refetch())}>Verify</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
