export default async function ProjectsPage() {
  // Placeholder static list; wire to API later
  const projects = [] as { id: string; name: string; runtimeType: string; previewUrl?: string }[];
  return (
    <div style={{ padding: 24 }}>
      <h1>Projects</h1>
      <table>
        <thead>
          <tr><th>Name</th><th>Type</th><th>Preview</th></tr>
        </thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.runtimeType}</td>
              <td>{p.previewUrl ? <a href={p.previewUrl} target="_blank">Open</a> : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
