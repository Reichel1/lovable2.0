'use client';
import { useQuery } from '@tanstack/react-query';
import { PlatformClient } from '@platform/sdk';

export default function BuildsPage() {
  const client = new PlatformClient({ baseUrl: '/api' });
  const { data, isLoading, error } = useQuery({ queryKey: ['builds'], queryFn: () => client.getDeployments() });
  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load builds</div>;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Builds</h1>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>ID</th><th>Status</th><th>Logs</th></tr></thead>
        <tbody>
          {data.map((b: any) => (
            <tr key={b.id} className="border-t">
              <td className="font-mono text-xs">{b.id}</td>
              <td>{b.status}</td>
              <td>{b.logsUrl ? <a className="underline" href={b.logsUrl} target="_blank">View logs</a> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
