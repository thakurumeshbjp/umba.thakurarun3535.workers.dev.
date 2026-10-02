import { executePlan } from './github-integration.js';

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return jsonResponse({ ok: true }, 200);
    }

    if (request.method === 'GET' && url.pathname === '/') {
      return jsonResponse({
        ok: true,
        service: 'UMBA Agent Worker',
        status: 'active',
        endpoints: {
          POST: '/'
        }
      }, 200);
    }

    if (request.method !== 'POST') {
      return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return jsonResponse({ ok: false, error: 'Invalid JSON body' }, 400);
    }

    const plan = body?.plan || body;

    if (!plan || (!plan.operations && !plan.steps)) {
      return jsonResponse({
        ok: false,
        error: 'Missing plan: send { plan: { operations: [...] } } or a raw plan object.'
      }, 400);
    }

    try {
      const result = await executePlan(plan, env);
      return jsonResponse({
        ok: true,
        result
      }, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return jsonResponse({
        ok: false,
        error: message
      }, 500);
    }
  }
};
