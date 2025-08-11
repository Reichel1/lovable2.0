'use client';
import { useQuery } from '@tanstack/react-query';
import { PlatformClient } from '@platform/sdk';
import { useState } from 'react';

export default function BuildsPage() {
  const client = new PlatformClient({ baseUrl: '/api' });
  const [projectId, setProjectId] = useState('');
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ['builds', projectId], queryFn: () => client.getProjectBuilds(projectId), enabled: !!projectId });
  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load builds</div>;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Builds</h1>
      <div className="space-x-2">
        <input className="border px-2 py-1" placeholder="Project ID" value={projectId} onChange={(e)=>setProjectId(e.target.value)} />
        <button className="border px-2 py-1" onClick={()=>refetch()}>Load</button>
        {projectId && (
          <button className="border px-2 py-1" onClick={async ()=>{ await client.startBuild({ projectId, projectSlug: projectId, repoSlug: 'owner/repo', gitRef: 'main' }); refetch(); }}>Start build</button>
        )}
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>ID</th><th>Status</th><th>Created</th><th>Finished</th><th>Logs</th><th>Preview</th></tr></thead>
        <tbody>
          {data?.map((b: any) => (
            <tr key={b.id} className="border-t">
              <td className="font-mono text-xs">{b.id}</td>
              <td>{b.status}</td>
              <td>{b.created_at ?? '—'}</td>
              <td>{b.finished_at ?? '—'}</td>
              <td>{b.logs_url ? <a className="underline" href={b.logs_url} target="_blank">View logs</a> : '—'}</td>
              <td>{b.artifact_manifest_url ? <a className="underline" href={b.artifact_manifest_url.replace(/\/manifest\.json$/, '')} target="_blank">Open</a> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
