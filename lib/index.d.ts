/** Preserve the host's current Team tools; adapt only missing wait capabilities. */
import type { Context } from '@deepseek-ai/cordis';
import type z from '@deepseek-ai/schemastery';
import { type Diagnostics } from './wake-core.js';
export declare const name = "dsh-team-flow-continuous";
export declare const inject: string[];
export declare const Config: z<Record<string, unknown>>;
export declare function apply(ctx: Context, config?: Record<string, unknown>): Promise<void>;
export declare function install(ctx: Context, config?: Record<string, unknown>, observe?: (event: string, fields?: object) => void): Promise<{
    diagnostics: Diagnostics;
}>;
