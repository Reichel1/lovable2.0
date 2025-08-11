import { z } from 'zod';

export const ShopifyConnection = z.object({
  shopDomain: z.string(),
  accessToken: z.string(),
});
export type ShopifyConnection = z.infer<typeof ShopifyConnection>;
