import readline from "node:readline";

const [, , source = "unknown", fixtureVersion = "unknown", marker = "unknown"] = process.argv;
const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
const send = (id, result) => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id, result }) + "\n");

for await (const line of rl) {
  if (!line.trim()) continue;
  let message;
  try { message = JSON.parse(line); } catch { continue; }
  if (message.id === undefined) continue;
  if (message.method === "initialize") {
    send(message.id, {
      protocolVersion: message.params?.protocolVersion ?? "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: source + "-agentplugin-fixture", version: fixtureVersion }
    });
  } else if (message.method === "ping") {
    send(message.id, {});
  } else if (message.method === "tools/list") {
    send(message.id, { tools: [{
      name: "agentplugin_fixture_marker",
      description: "Return the immutable marker for this AgentPlugin fixture.",
      inputSchema: { type: "object", properties: { echo: { type: "string" } }, additionalProperties: false }
    }] });
  } else if (message.method === "tools/call" && message.params?.name === "agentplugin_fixture_marker") {
    const payload = { marker, source, fixtureVersion, echo: message.params?.arguments?.echo ?? "" };
    send(message.id, { content: [{ type: "text", text: JSON.stringify(payload) }], structuredContent: payload, isError: false });
  } else {
    process.stdout.write(JSON.stringify({ jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Method not found" } }) + "\n");
  }
}
