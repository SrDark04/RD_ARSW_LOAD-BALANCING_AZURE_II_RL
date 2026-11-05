var bigInt = require("big-integer");

// Caché en memoria a nivel de instancia del worker (Memoization)
const memo = {
    0: bigInt.zero,
    1: bigInt.one
};
let maxCached = 1;
const CHUNK_SIZE = 1000;

function fibMemo(n) {
    if (memo[n] !== undefined) {
        return memo[n];
    }
    memo[n] = fibMemo(n - 1).add(fibMemo(n - 2));
    return memo[n];
}

module.exports = async function (context, req) {
    context.log('JavaScript HTTP trigger function (FibonacciMemoization) processed a request.');

    let nth = req.body && req.body.nth !== undefined ? Number(req.body.nth) : Number(req.query.nth);
    const startTime = Date.now();

    if (isNaN(nth) || nth < 0) {
        throw 'must be greater than 0';
    }

    const isCacheHit = memo[nth] !== undefined;

    if (!isCacheHit && nth > maxCached) {
        // Avance recursivo por bloques para evitar RangeError: Maximum call stack size exceeded en V8
        for (let step = Math.floor(maxCached / CHUNK_SIZE) * CHUNK_SIZE + CHUNK_SIZE; step <= nth; step += CHUNK_SIZE) {
            fibMemo(step);
            fibMemo(step + 1);
            // Liberar nodos intermedios antiguos para no exceder el límite de 1.5 GB de RAM del plan Consumption,
            // conservando las parejas de puntos de control (step y step + 1) y los valores consultados.
            for (let k = step - CHUNK_SIZE + 2; k < step; k++) {
                delete memo[k];
            }
        }
        maxCached = Math.max(maxCached, nth);
    }

    let answer = fibMemo(nth);
    const elapsedMs = Date.now() - startTime;

    context.log(`nth=${nth} | cache=${isCacheHit ? 'HIT' : 'MISS'} | time=${elapsedMs}ms`);

    context.res = {
        headers: {
            "X-Cache": isCacheHit ? "HIT" : "MISS",
            "X-Execution-Time-Ms": elapsedMs.toString()
        },
        body: answer.toString()
    };
};
