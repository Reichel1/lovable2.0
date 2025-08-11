export default async function DomainsPage() {
  const domains: { id: string; hostname: string; verificationStatus: string }[] = [];
  return (
    <div style={{ padding: 24 }}>
      <h1>Domains</h1>
      <table>
        <thead>
          <tr><th>Hostname</th><th>Status</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {domains.map((d) => (
            <tr key={d.id}>
              <td>{d.hostname}</td>
              <td>{d.verificationStatus}</td>
              <td>
                <form action={`/api/domains/${d.id}/verify`} method="post">
                  <button type="submit">Verify</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
