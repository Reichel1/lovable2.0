export default async function BuildsPage() {
  const builds: { id: string; status: string; createdAt?: string; logsUrl?: string }[] = [];
  return (
    <div style={{ padding: 24 }}>
      <h1>Builds</h1>
      <table>
        <thead>
          <tr><th>ID</th><th>Status</th><th>Created</th><th>Logs</th></tr>
        </thead>
        <tbody>
          {builds.map((b) => (
            <tr key={b.id}>
              <td>{b.id}</td>
              <td>{b.status}</td>
              <td>{b.createdAt ?? '-'}</td>
              <td>{b.logsUrl ? <a href={b.logsUrl} target="_blank">View logs</a> : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
