const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const headers = {
    apikey: SUPABASE_KEY,
    Authorization: `Bearer ${SUPABASE_KEY}`,
    "Content-Type": "application/json",
};
export async function supabaseGet(table, params = {}, extraHeaders = {}) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString(), {
        headers: { ...headers, ...extraHeaders },
    });
    if (!res.ok) {
        throw new Error(`Supabase GET ${table}: ${res.status} ${await res.text()}`);
    }
    return res.json();
}
export async function supabaseRpc(fn, body = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        throw new Error(`Supabase RPC ${fn}: ${res.status} ${await res.text()}`);
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
}
export async function supabaseCount(table, params = {}) {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
    url.searchParams.set("select", "id");
    url.searchParams.set("limit", "1");
    for (const [k, v] of Object.entries(params)) {
        url.searchParams.set(k, v);
    }
    const res = await fetch(url.toString(), {
        headers: {
            ...headers,
            Prefer: "count=exact",
            Range: "0-0",
        },
    });
    if (!res.ok) {
        throw new Error(`Supabase COUNT ${table}: ${res.status} ${await res.text()}`);
    }
    const range = res.headers.get("content-range") ?? "";
    const total = range.split("/")[1];
    return total ? parseInt(total, 10) : 0;
}
