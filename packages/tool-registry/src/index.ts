import { z } from 'zod';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface ToolDefinition<I, O> {
  name: string;
  version: string;
  scopes: string[];
  risk: RiskLevel;
  input: z.ZodType<I>;
  output: z.ZodType<O>;
}

export class ToolRegistry {
  private tools = new Map<string, ToolDefinition<any, any>>();

  register<I, O>(def: ToolDefinition<I, O>) {
    const key = `${def.name}@${def.version}`;
    if (this.tools.has(key)) throw new Error('duplicate tool');
    this.tools.set(key, def);
  }

  get(name: string, version: string) {
    return this.tools.get(`${name}@${version}`);
  }

  list() {
    return Array.from(this.tools.values());
  }
}

// Example tool contract
export const CreateRepoInput = z.object({ name: z.string() });
export const CreateRepoOutput = z.object({ url: z.string().url() });
