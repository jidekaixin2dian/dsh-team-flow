import type { Context } from '@deepseek-ai/cordis';
/** Transform before registration; never mutate a registered readonly definition. */
export declare function installWaitResultAdapter(ctx: Context): () => void;
