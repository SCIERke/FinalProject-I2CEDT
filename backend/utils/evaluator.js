/** Call OpenAI Chat Completions to ask for strict JSON output */
async function openAiEvaluate(topic, essay) {
    try {
        console.log("OpenAI Eval:", topic, essay);

        const res = await fetch(`http://inference:4000/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: topic, text: essay }),
        });

        if (!res.ok) {
            throw new Error(`Inference API failed: ${res.status}`);
        }

        const data = await res.json();
        console.log(">>> Inference result:", data);
        return data;
    } catch (err) {
        console.error("Error in openAiEvaluate:", err);
        throw err;
    }
}

/** public function */
export default async function evaluateEssay(topic, essay) {
    try {
        return await openAiEvaluate(topic, essay);
    } catch (err) {
        console.error(
            "OpenAI evaluation failed, using mock. Error:",
            err
        );
        return {
            ...mockEvaluate(essay),
            rawFallbackError: err,
        };
    }
}