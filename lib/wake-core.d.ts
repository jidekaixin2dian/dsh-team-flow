import type { Context } from '@deepseek-ai/cordis';
export interface Diagnostics {
    active: number;
    wakes: number;
    decorated: number;
    disabled: boolean;
}
export declare function installSteerWake(ctx: Context, observe?: (event: string, fields?: object) => void): {
    diagnostics: Diagnostics;
};
