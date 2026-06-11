export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    const path = url.pathname;

    // CORS helper
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // HEALTH CHECK
    if (path === "/health") {
      return Response.json({ ok: true }, { headers: corsHeaders });
    }

    // CHAT (AI)
    if (path === "/chat" && request.method === "POST") {

      const { question } = await request.json();

      const ai = await env.AI.run(
        "@cf/meta/llama-3.1-8b-instruct",
        {
          messages: [{ role: "user", content: question }]
        }
      );

      return Response.json(
        { answer: ai.response },
        { headers: corsHeaders }
      );
    }

    // EMPLOYEES (dummy for now)
    if (path === "/employees") {
      return Response.json(
        [{ id: 1, name: "Test Employee" }],
        { headers: corsHeaders }
      );
    }

    return new Response("Not Found", { status: 404 });
  }
};
