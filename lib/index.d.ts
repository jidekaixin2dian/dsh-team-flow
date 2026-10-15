/** Preserve the host's current Team tools; adapt only missing wait capabilities. */
import type { Context } from '@deepseek-ai/cordis';
import * as TeamTools from '@deepseek-ai/dsh-experimental-tool-agent-team';
import { type Diagnostics } from './wake-core.js';
export declare const name = "dsh-team-flow-continuous";
export declare const inject: string[];
export declare const Config: typeof TeamTools.Config;
export declare function apply(ctx: Context, config?: TeamTools.Config): Promise<void>;
export declare function install(ctx: Context, config?: TeamTools.Config, observe?: (event: string, fields?: object) => void): Promise<{
    diagnostics: Diagnostics;
}>;
