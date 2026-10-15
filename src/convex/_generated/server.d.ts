export type QueryCtx = any;
export type MutationCtx = any;

export function query<T extends { args?: any; handler: (...args: any[]) => any }>(cfg: T): T;
export function mutation<T extends { args?: any; handler: (...args: any[]) => any }>(cfg: T): T;
