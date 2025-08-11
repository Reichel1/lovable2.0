export interface PlanTask {
  id: string;
  kind: 'scaffold' | 'build' | 'deploy' | 'domain' | 'migrate' | 'automation' | 'analytics';
  risk: 'low' | 'medium' | 'high';
  inputs: Record<string, unknown>;
}

export interface RunState {
  goal: string;
  tasks: PlanTask[];
  approvalsRequired: string[];
}

export function planFromGoal(goal: string): RunState {
  // Placeholder: turn goal into minimal scaffold -> build -> preview deploy plan
  return {
    goal,
    tasks: [
      { id: 't1', kind: 'scaffold', risk: 'medium', inputs: {} },
      { id: 't2', kind: 'build', risk: 'low', inputs: {} },
      { id: 't3', kind: 'deploy', risk: 'medium', inputs: { target: 'preview' } },
    ],
    approvalsRequired: [],
  };
}
