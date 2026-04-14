export declare function supabaseGet<T = unknown>(table: string, params?: Record<string, string>, extraHeaders?: Record<string, string>): Promise<T>;
export declare function supabaseRpc<T = unknown>(fn: string, body?: Record<string, unknown>): Promise<T>;
export declare function supabaseCount(table: string, params?: Record<string, string>): Promise<number>;
