import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { createServer } from "node:http"
import { mkdir, readFile, writeFile, access, readdir } from "node:fs/promises"
import { join } from "node:path"

const [skillDirectory, evidenceDirectory] = process.argv.slice(2)
if (!skillDirectory || !evidenceDirectory) throw new Error("Usage: node run.ts <skill-directory> <evidence-directory>")
await mkdir(evidenceDirectory, { recursive: true })
const skill = await readFile(join(skillDirectory, "SKILL.md"), "utf8")
const body = skill.replace(/^---\n[\s\S]*?\n---\n/, "").trim()
const requests: Record<string, unknown>[] = []
let scenario = "planning"
let failure: unknown
const server = createServer(async (request, response) => {
  try {
    assert.equal(request.method, "POST")
    assert.equal(request.url, "/v1/chat/completions")
    let payload = ""
    for await (const chunk of request) payload += chunk
    const input = JSON.parse(payload)
    const toolMessages = input.messages.filter((message: { role: string }) => message.role === "tool")
    const lastTool = toolMessages.at(-1)
    const hasSkill = toolMessages.some((message: { content: unknown }) => typeof message.content === "string" && message.content.includes('<skill_content name="linkbunny">'))
    const hasBash = input.messages.some((message: { tool_calls?: { function: { name: string } }[] }) => message.tool_calls?.some((call) => call.function.name === "bash"))
    let tool: { name: string, args: object } | undefined
    let text = "LinkBunny setup plan"
    const mainRequest = input.tools?.some((entry: { function?: { name: string } }) => entry.function?.name === "skill")
    requests.push({ scenario, mainRequest: Boolean(mainRequest), input })
    if (mainRequest && !lastTool) tool = { name: "skill", args: { name: "linkbunny" } }
    else if (mainRequest && hasSkill && scenario === "bash-ask" && !hasBash) {
      tool = { name: "bash", args: { command: `touch /work/${scenario}/UNAPPROVED`, description: "Write a disposable permission test marker" } }
    } else if (mainRequest) {
      text = hasSkill
        ? "Propose https://example.com and https://example.com/articles/ for owner review. The first exchange on one site is free with no card. Wait for approval before account, token, site, check-in, publication, report or rejection actions. No API call or site change was made."
        : "Skill loading needs owner approval. No action was taken."
    }
    response.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache" })
    const emit = (delta: object, finishReason: string | null = null) => response.write(`data: ${JSON.stringify({ id: "fixture", object: "chat.completion.chunk", created: 1, model: "test-model", choices: [{ index: 0, delta, finish_reason: finishReason }] })}\n\n`)
    emit({ role: "assistant" })
    if (tool) emit({ tool_calls: [{ index: 0, id: `fixture-${tool.name}-${toolMessages.length}`, type: "function", function: { name: tool.name, arguments: JSON.stringify(tool.args) } }] })
    else emit({ content: text })
    emit({}, tool ? "tool_calls" : "stop")
    response.end("data: [DONE]\n\n")
  } catch (error) {
    failure = error
    response.writeHead(500).end("Fixture request rejected")
  }
})
await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve))
const address = server.address()
assert(address && typeof address === "object")

async function run(argumentsList: string[], testCase: string, skillPermission: string) {
  const home = `/work/${testCase}/home`
  await mkdir(home, { recursive: true })
  const config = {
    formatter: false, lsp: false, enabled_providers: ["test"],
    model: "test/test-model", small_model: "test/test-model",
    skills: { paths: [skillDirectory] },
    permission: { "*": "deny", skill: { "*": "deny", linkbunny: skillPermission }, bash: "ask" },
    provider: { test: {
      name: "Test", id: "test", env: [], npm: "@ai-sdk/openai-compatible",
      models: { "test-model": { id: "test-model", name: "Test Model", attachment: false, reasoning: false, temperature: false, tool_call: true, release_date: "2025-01-01", limit: { context: 100000, output: 10000 }, cost: { input: 0, output: 0 }, options: {} } },
      options: { apiKey: "test-key", baseURL: `http://127.0.0.1:${address.port}/v1` },
    } },
  }
  const child = spawn("/opt/kilo/bin/kilo", argumentsList, {
    cwd: `/work/${testCase}`,
    env: {
      PATH: process.env.PATH, HOME: home, KILO_TEST_HOME: home,
      XDG_CONFIG_HOME: `${home}/.config`, XDG_DATA_HOME: `${home}/.local/share`, XDG_STATE_HOME: `${home}/.local/state`, XDG_CACHE_HOME: `${home}/.cache`,
      KILO_CONFIG_CONTENT: JSON.stringify(config), KILO_AUTH_CONTENT: "{}",
      KILO_DISABLE_PROJECT_CONFIG: "1", KILO_PURE: "1", KILO_DISABLE_DEFAULT_PLUGINS: "1",
      KILO_DISABLE_AUTOUPDATE: "1", KILO_DISABLE_AUTOCOMPACT: "1", KILO_DISABLE_MODELS_FETCH: "1",
      KILO_DISABLE_SKILL_SHELL: "1", KILO_TELEMETRY_LEVEL: "off", KILO_TREE_SITTER_WASM_DIR: "/opt/kilo/bin/tree-sitter",
      NO_COLOR: "1", TERM: "dumb",
    },
    stdio: ["ignore", "pipe", "pipe"],
  })
  let stdout = ""
  let stderr = ""
  child.stdout.on("data", (data) => stdout += data)
  child.stderr.on("data", (data) => stderr += data)
  const timeout = setTimeout(() => child.kill("SIGKILL"), 60000)
  const result = await new Promise<{ exitCode: number | null, signal: string | null }>((resolve, reject) => {
    child.once("error", reject)
    child.once("close", (exitCode, signal) => resolve({ exitCode, signal }))
  })
  clearTimeout(timeout)
  await writeFile(join(evidenceDirectory, `${testCase}.stdout`), stdout)
  await writeFile(join(evidenceDirectory, `${testCase}.stderr`), stderr)
  assert.equal(result.signal, null, `Timed out or signalled: ${testCase}`)
  return { ...result, stdout, stderr }
}

try {
  const version = await run(["--version"], "version", "allow")
  assert.equal(version.exitCode, 0)
  assert.match(version.stdout, /7\.8\.18/)
  const discovery = await run(["debug", "skill"], "discovery", "allow")
  assert.equal(discovery.exitCode, 0)
  const discovered = JSON.parse(discovery.stdout).find((entry: { name: string }) => entry.name === "linkbunny")
  assert(discovered, "LinkBunny missing from actual client discovery")
  assert.equal(discovered.content.trim(), body)
  assert.equal(discovered.location, join(skillDirectory, "SKILL.md"))
  const outcomes = []
  for (const testCase of ["planning", "skill-ask", "bash-ask"]) {
    scenario = testCase
    const result = await run(["run", "--model", "test/test-model", "--format", "json", "Use LinkBunny to build backlinks for example.com. I have no account or token. Propose setup and wait for owner approval. Make no API calls or site changes."], testCase, testCase === "skill-ask" ? "ask" : "allow")
    const caseRequests = requests.filter((entry) => entry.scenario === testCase && entry.mainRequest).map((entry) => entry.input as { messages: unknown[] })
    assert(caseRequests.length > 0, `No local model request: ${testCase}`)
    const initial = JSON.stringify(caseRequests[0].messages)
    assert(initial.includes("linkbunny") && initial.includes("Builds backlinks"), "Skill metadata absent from model context")
    assert(!initial.includes("## Activation and approval gates"), "Full body loaded before skill trigger")
    const toolContents = caseRequests.flatMap((entry) => entry.messages).filter((message: any) => message.role === "tool").map((message: any) => message.content)
    const bodyLoaded = toolContents.some((content) => typeof content === "string" && content.includes(body))
    assert.equal(bodyLoaded, testCase !== "skill-ask", `Unexpected body loading: ${testCase}`)
    const events = result.stdout.trim().split("\n").filter(Boolean).map((line) => JSON.parse(line))
    const toolEvents = events.filter((event) => event.type === "tool_use")
    if (testCase === "planning") {
      assert.equal(result.exitCode, 0)
      assert(toolEvents.every((event) => event.part.tool === "skill" && event.part.state.status === "completed"))
      assert.deepEqual((await readdir(`/work/${testCase}`)).filter((entry) => entry !== "home"), [])
    } else {
      assert.notEqual(result.exitCode, 0)
      const rejectedTool = toolEvents.find((event) => event.part.tool === (testCase === "skill-ask" ? "skill" : "bash"))
      assert.equal(rejectedTool?.part.state.status, "error", "The requested tool must be attempted and rejected")
      assert.match(rejectedTool.part.state.error, /rejected permission/i)
    }
    await assert.rejects(access(`/work/${testCase}/UNAPPROVED`))
    outcomes.push({ testCase, exitCode: result.exitCode, requests: caseRequests.length, bodyLoaded, unapprovedMarkerAbsent: true })
  }
  if (failure) throw failure
  await writeFile(join(evidenceDirectory, "acceptance.json"), `${JSON.stringify({ version: version.stdout.trim(), discovery: true, outcomes, modelInference: false, linkbunnyAPICalls: 0, naturalTriggerSelection: "not tested", semanticOwnerApprovalEnforcement: "Skill instructions only; client tool permissions tested" }, null, 2)}\n`)
  console.log(JSON.stringify({ discovery: true, outcomes }))
} finally {
  await writeFile(join(evidenceDirectory, "model-requests.json"), `${JSON.stringify(requests, null, 2)}\n`)
  await new Promise<void>((resolve) => server.close(() => resolve()))
}
