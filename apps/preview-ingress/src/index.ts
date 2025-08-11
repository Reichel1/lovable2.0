export interface Env {
  PREVIEW_ARTIFACTS: R2Bucket;
}

function notFound(message: string) {
  return new Response(message, { status: 404, headers: { 'cache-control': 'no-store' } });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    // Expect host like pr-47--myproj.preview.domain
    const [left, preview] = url.host.split('.');
    if (!left || preview !== 'preview') {
      return notFound('Not a preview host');
    }
    const [prPart, project] = left.split('--');
    const prMatch = /^pr-(\d+)$/.exec(prPart ?? '');
    if (!prMatch || !project) {
      return new Response('Invalid preview host', { status: 400 });
    }

    // Resolve path within artifact bundle
    const path = url.pathname === '/' ? '/index.html' : url.pathname;
    const key = `${project}/${prMatch[1]}${path}`.replace(/\/+/, '/');

    // Try direct object
    const object = await env.PREVIEW_ARTIFACTS.get(key);
    if (!object) {
      return notFound('Artifact not found');
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=60, s-maxage=600');
    return new Response(object.body, { headers });
  },
};
