import type { Context } from '@deepseek-ai/cordis';
/** Transform before registration; never mutate a registered readonly definition. */
export declare function decorateRegistrations(ctx: Context): () => void;
