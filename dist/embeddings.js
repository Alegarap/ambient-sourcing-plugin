const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export async function generateEmbedding(text) {
    if (!OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY not set — semantic search is unavailable. " +
            "Set the env var or run setup.sh to configure 1Password credentials.");
    }
    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "openai/text-embedding-3-small",
            input: text,
        }),
    });
    if (!res.ok) {
        throw new Error(`OpenRouter embeddings: ${res.status} ${await res.text()}`);
    }
    const data = (await res.json());
    return data.data[0].embedding;
}
