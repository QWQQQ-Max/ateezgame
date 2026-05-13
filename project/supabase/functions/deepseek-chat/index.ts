import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface RequestBody {
  systemPrompt: string;
  messages: Message[];
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "DEEPSEEK_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { systemPrompt, messages }: RequestBody = await req.json();

    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.9,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(
        JSON.stringify({ error: `DeepSeek API error: ${err}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
