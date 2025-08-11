export type KPI = 'traffic' | 'conversion' | 'revenue';

export function track(event: string, props: Record<string, unknown> = {}) {
  // placeholder
  return { ok: true, event, props };
}
