const { parentPort } = require("worker_threads");
const OpenAI = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function compareTexts(pair) {
    try {
        const [embedding1, embedding2] = await Promise.all([
            getEmbedding(pair[0]),
            getEmbedding(pair[1]),
        ]);
        const similarity = cosineSimilarity(embedding1, embedding2);
        const comps = {
            query: pair[0],
            comparison: pair[1],
            similiarity: similarity,
        };
        if (typeof comps !== "undefined") {
            return comps;
        }
    } catch (error) {
        console.error("Error comparing texts:", error);
    }
}
async function getEmbedding(text) {
    const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text,
    });
    return embedding.data[0]["embedding"];
}
function cosineSimilarity(A, B) {
    var dotproduct = 0;
    var mA = 0;
    var mB = 0;
    for (var i = 0; i < A.length; i++) {
        dotproduct += A[i] * B[i];
        mA += A[i] * A[i];
        mB += B[i] * B[i];
    }

    mA = Math.sqrt(mA);
    mB = Math.sqrt(mB);
    var similarity = dotproduct / (mA * mB);

    return similarity;
}

parentPort.on("message", async (data) => {
    compareTexts(data).then((data) => {
        parentPort.postMessage([data, "done"]);
    });
});
