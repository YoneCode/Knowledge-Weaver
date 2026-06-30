// Cloudflare Pages Function — JSON-RPC proxy for GenLayer Bradbury.
//
// Why this exists: the Bradbury RPC node strictly requires an INTEGER
// JSON-RPC `id`. Some wallets (notably MetaMask) submit transactions with a
// STRING `id`, which the node rejects with:
//   "cannot unmarshal string into Go struct field Request.id of type int"
//
// This proxy rewrites every request `id` to an integer before forwarding to
// the upstream node, then restores the original `id` on the way back so the
// wallet's JSON-RPC client can still match responses to requests.
//
// Served at: /rpc  (same origin as the dApp)

const UPSTREAM = "https://rpc-bradbury.genlayer.com";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...CORS },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400);
  }

  const isBatch = Array.isArray(body);
  const items = isBatch ? body : [body];

  // Map our integer ids back to the caller's original ids.
  const back = new Map();
  let counter = 1;
  const normalized = items.map((item) => {
    if (item && typeof item === "object") {
      const intId = counter++;
      if ("id" in item) back.set(intId, item.id);
      return { ...item, id: intId };
    }
    return item;
  });

  let upstreamRes;
  try {
    upstreamRes = await fetch(UPSTREAM, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isBatch ? normalized : normalized[0]),
    });
  } catch (e) {
    return jsonResponse(
      { jsonrpc: "2.0", id: null, error: { code: -32603, message: "Upstream fetch failed" } },
      502,
    );
  }

  let data;
  const text = await upstreamRes.text();
  try {
    data = JSON.parse(text);
  } catch {
    // Non-JSON upstream response — pass it through verbatim.
    return new Response(text, {
      status: upstreamRes.status,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const restore = (res) => {
    if (res && typeof res === "object" && "id" in res && back.has(res.id)) {
      res.id = back.get(res.id);
    }
    return res;
  };
  const out = Array.isArray(data) ? data.map(restore) : restore(data);
  return jsonResponse(out, upstreamRes.status);
}
