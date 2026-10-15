/** Capability-based plugin compatibility layer. Does not alter installed files. */
import z from '@deepseek-ai/schemastery';
import type { Context } from '@deepseek-ai/cordis';
export declare const name = "dsh-team-flow-rc2";
export declare const inject: string[];
export interface Config {
    freshProvider?: string;
    forkProvider?: string;
}
export interface Diagnostics {
    active: number;
    wakes: number;
    decorated: number;
    disabled: boolean;
}
export declare const Config: z<Config>;
export declare function apply(ctx: Context, config?: Config): void;
export declare function install(ctx: Context, _config?: Config, observe?: (event: string, fields?: object) => void): {
    diagnostics: Diagnostics;
};
