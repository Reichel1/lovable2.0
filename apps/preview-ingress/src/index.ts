export interface Env {}

export default {
  async fetch(request: Request, _env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Expect host like pr-47--project.preview.domain
    const [left, preview, ...rest] = url.host.split('.');
    if (!left || preview !== 'preview') {
      return new Response('Not a preview host', { status: 404 });
    }
    // left: pr-47--project
    const [prPart, project] = left.split('--');
    const prMatch = /^pr-(\d+)$/.exec(prPart ?? '');
    if (!prMatch || !project) {
      return new Response('Invalid preview host', { status: 400 });
    }

    // In a real impl, look up artifact URL by project+pr, then proxy
    const target = `https://r2-cdn.example.com/${project}/${prMatch[1]}/index.html`;
    return fetch(target, { headers: request.headers });
  },
};
