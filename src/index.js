export default {
  async fetch(request, env) {

    const url = new URL(request.url);
    const path = url.pathname;

    // -----------------------------
    // CORS HEADERS (IMPORTANT)
    // -----------------------------
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS,DELETE",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // -----------------------------
    // HOME ROUTE (/)
    // -----------------------------
    if (path === "/") {
      return new Response(
        `
        <h1>Cloud Worker API Running ✅</h1>
        <p>Available routes:</p>
        <ul>
          <li>/chat (POST)</li>
          <li>/employees (GET)</li>
          <li>/health (GET)</li>
        </ul>
        `,
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "text/html; charset=utf-8"
          }
        }
      );
    }

    // -----------------------------
    // HEALTH CHECK
    // -----------------------------
    if (path === "/health") {
      return Response.json(
        { status: "ok" },
        { headers: corsHeaders }
      );
    }

    // -----------------------------
    // AI CHAT ROUTE
    // -----------------------------
    if (path === "/chat" && request.method === "POST") {
      try {
        const { question } = await request.json();

        const ai = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            messages: [
              { role: "user", content: question }
            ]
          }
        );

        const answer = ai.response;

        return Response.json(
          { answer },
          { headers: corsHeaders }
        );

      } catch (err) {
        return Response.json(
          { error: "AI failed", details: err.toString() },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // -----------------------------
    // EMPLOYEES - GET ALL
    // -----------------------------
    if (path === "/employees" && request.method === "GET") {
      try {
        const data = await env.DB.prepare(
          "SELECT * FROM employees"
        ).all();

        return Response.json(
          data.results,
          { headers: corsHeaders }
        );

      } catch (err) {
        return Response.json(
          { error: "DB error", details: err.toString() },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // -----------------------------
    // EMPLOYEES - ADD
    // -----------------------------
    if (path === "/employees" && request.method === "POST") {
      try {
        const { name, email, department, salary } = await request.json();

        await env.DB.prepare(
          "INSERT INTO employees (name, email, department, salary) VALUES (?, ?, ?, ?)"
        )
          .bind(name, email, department, salary)
          .run();

        return Response.json(
          { message: "Employee added" },
          { headers: corsHeaders }
        );

      } catch (err) {
        return Response.json(
          { error: "Insert failed", details: err.toString() },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // -----------------------------
    // EMPLOYEES - DELETE
    // -----------------------------
    if (path.startsWith("/employees/") && request.method === "DELETE") {
      try {
        const id = path.split("/")[2];

        await env.DB.prepare(
          "DELETE FROM employees WHERE id=?"
        )
          .bind(id)
          .run();

        return Response.json(
          { message: "Deleted" },
          { headers: corsHeaders }
        );

      } catch (err) {
        return Response.json(
          { error: "Delete failed", details: err.toString() },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // -----------------------------
    // NOT FOUND
    // -----------------------------
    return new Response("Not Found", {
      status: 404,
      headers: corsHeaders
    });
  }
};
