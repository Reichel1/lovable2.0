'use client';
import { useQuery } from '@tanstack/react-query';
import { PlatformClient } from '@platform/sdk';

export default function ProjectsPage() {
  const client = new PlatformClient({ baseUrl: '/api' });
  const { data, isLoading, error } = useQuery({ queryKey: ['projects'], queryFn: () => client.getProjects() });
  if (isLoading) return <div className="p-6">Loading…</div>;
  if (error) return <div className="p-6 text-red-600">Failed to load projects</div>;
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Projects</h1>
      <table className="w-full text-sm">
        <thead><tr className="text-left"><th>Name</th><th>Type</th><th>Preview</th></tr></thead>
        <tbody>
          {data.map((p: any) => (
            <tr key={p.id} className="border-t">
              <td>{p.name}</td>
              <td className="uppercase">{p.runtimeType}</td>
              <td>
                {p.latestPreviewUrl ? (
                  <a className="underline" href={p.latestPreviewUrl} target="_blank">Open</a>
                ) : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
