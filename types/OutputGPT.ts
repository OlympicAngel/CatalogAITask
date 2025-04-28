import { z } from "zod";

/** scheme for validation gpt output */
export const OutputGPT_scheme = z.object({
    query: z.string(),
    filters: z.string().nullable().optional()
        .transform((val) => (!val ? undefined : val)), //if null / "" / false - return undefined
})

/** inferred type */
export type OutputGPT = z.infer<typeof OutputGPT_scheme>