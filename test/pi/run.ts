import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { join, resolve } from "node:path"
import { createAssistantMessageEventStream, InMemoryCredentialStore } from "@earendil-works/pi-ai"
import {
  createAgentSession, DefaultResourceLoader, formatSkillsForPrompt, ModelRuntime,
  SessionManager, SettingsManager,
} from "@earendil-works/pi-coding-agent"

const [tarball, evidenceDirectory] = process.argv.slice(2)
assert(tarball && evidenceDirectory, "Pass the tarball and evidence directory")
assert.equal(process.env.PI_OFFLINE, "1")
assert.equal(process.env.PI_TELEMETRY, "0")
const clientEntry = resolve("dist/bundle/cli.js")
const clientManifest = JSON.parse(readFileSync("package.json", "utf8"))
assert.equal(clientManifest.name, "@earendil-works/pi-coding-agent")
assert.equal(clientManifest.version, "1.5.0")
const cwd = "/work/site"
const agentDir = "/work/agent"
const packageDirectory = "/work/unpacked/package"
const hasLocalPackage = settings => settings.packages?.some(entry =>
  resolve(agentDir, typeof entry === "string" ? entry : entry.source) === packageDirectory,
) ?? false
for (const directory of [cwd, agentDir, "/work/home", "/work/unpacked", evidenceDirectory]) mkdirSync(directory, { recursive: true })
writeFileSync(join(cwd, "index.html"), "<h1>Example development notes</h1>\n")
const cli = (name, args) => {
  const result = spawnSync(process.execPath, [clientEntry, ...args], {
    cwd, env: process.env, encoding: "utf8", timeout: 30_000,
  })
  writeFileSync(join(evidenceDirectory, `${name}.log`), `${result.stdout ?? ""}${result.stderr ?? ""}`)
  assert.equal(result.status, 0, `${name}: ${result.stderr || result.error || result.stdout}`)
  return result.stdout
}
const extracted = spawnSync("tar", ["-xzf", tarball, "-C", "/work/unpacked"], { encoding: "utf8" })
assert.equal(extracted.status, 0, extracted.stderr)
cli("version", ["--version"])
cli("install", ["install", packageDirectory])
const listed = cli("list", ["list"])
assert(listed.includes(packageDirectory))
const installedSettings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"))
assert(hasLocalPackage(installedSettings))
const settingsManager = SettingsManager.create(cwd, agentDir, { projectTrusted: false })
settingsManager.setCompactionEnabled(false)
settingsManager.setRetryEnabled(false)
settingsManager.setCacheWarmingMode("off")
const loader = new DefaultResourceLoader({
  cwd, agentDir, settingsManager,
  noExtensions: true, disabledBuiltinExtensions: ["mcp"], extensionFactories: [],
  noPromptTemplates: true, noThemes: true, noContextFiles: true,
  systemPrompt: "Offline Skill package acceptance fixture.", appendSystemPrompt: [],
})
await loader.reload()
const { skills, diagnostics } = loader.getSkills()
assert.deepEqual(diagnostics, [])
assert.equal(skills.length, 1)
const skill = skills[0]
assert.equal(skill.name, "linkbunny")
assert.equal(skill.filePath, join(packageDirectory, "skills/linkbunny/SKILL.md"))
const skillText = readFileSync(skill.filePath, "utf8")
const skillBody = skillText.replace(/^---\n[\s\S]*?\n---\n/, "").trim()
const advertisedSkills = formatSkillsForPrompt(skills)
assert(advertisedSkills.includes("linkbunny"))
assert(advertisedSkills.includes(skill.filePath))
assert(!advertisedSkills.includes(skillBody))
for (const marker of [
  "### Before the owner has an account", "Make no LinkBunny API call while there is no token.",
  "Never ask for the token in chat", "Obtain action-time owner authorization",
  "it never\nauthorizes publication", "obtain report-completion authorization",
]) assert(skillText.includes(marker), `Missing canonical safety instruction: ${marker}`)
assert.equal(loader.getExtensions().extensions.length, 0)
const credentials = new InMemoryCredentialStore()
await credentials.modify("offline-fixture", async () => ({ type: "api_key", key: "fixture-only-never-real" }))
const runtime = await ModelRuntime.create({
  credentials, modelsPath: null, allowModelNetwork: false, refreshOnCreate: false,
})
const plan = "Plan https://example.test/ as the target and https://example.test/notes/ as the eligible link area, on the same domain. The first exchange is free for one site, with no card; continuation is $20/month for up to 10 sites. Profiles need review and a check-in may return no request. With your approval, open the LinkBunny setup login URL and let you create the token. With your approval, prepare an ignored empty token file or use your chosen secret store. Never paste the token into chat. After you confirm it is saved, make one read-only status request. Ask separately before site registration, check-in, publication, report, rejection, or account and billing changes. No API call or site change has been made."
let providerCalls = 0
let fetchAttempts = 0
const contexts = []
globalThis.fetch = async () => { fetchAttempts++; throw new Error("Network forbidden by fixture") }
runtime.registerProvider("offline-fixture", {
  api: "offline-fixture-api", baseUrl: "https://offline-fixture.invalid",
  models: [{
    id: "fixture-model", name: "Offline fixture model", reasoning: false, input: ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 }, contextWindow: 128000, maxTokens: 4096,
  }],
  streamSimple: (model, context) => {
    providerCalls++
    contexts.push(structuredClone(context.messages))
    const message = {
      role: "assistant", content: [{ type: "text", text: plan }], api: model.api,
      provider: model.provider, model: model.id, stopReason: "stop", timestamp: 1,
      usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } },
    }
    const stream = createAssistantMessageEventStream()
    stream.push({ type: "start", partial: { ...message, content: [] } })
    stream.push({ type: "done", reason: "stop", message })
    return stream
  },
})
const model = runtime.getModel("offline-fixture", "fixture-model")
assert(model)
const { session } = await createAgentSession({
  cwd, agentDir, settingsManager, resourceLoader: loader, modelRuntime: runtime, model,
  thinkingLevel: "off", noTools: "all", sessionManager: SessionManager.inMemory(cwd),
})
const toolEvents = []
const completed = []
const unsubscribe = session.subscribe(event => {
  if (event.type.startsWith("tool_execution_")) toolEvents.push(event.type)
  if (event.type === "message_end" && event.message.role === "assistant") completed.push(event.message)
})
try {
  const request = "Plan setup for my example development-notes site. I have no LinkBunny account or token. Make no API calls or site changes."
  await session.prompt(`/skill:linkbunny ${request}`)
  assert.equal(providerCalls, 1)
  const userInput = contexts[0].filter(message => message.role === "user").map(message => JSON.stringify(message.content)).join("\n")
  const decodedInput = contexts[0].filter(message => message.role === "user").flatMap(message => message.content).filter(part => part.type === "text").map(part => part.text).join("\n")
  assert(userInput.includes("linkbunny"))
  assert(decodedInput.includes(skillBody))
  assert(decodedInput.includes(skill.filePath))
  assert(decodedInput.includes(request))
  assert.equal(completed.length, 1)
  assert.equal(completed[0].stopReason, "stop")
  assert.equal(session.getLastAssistantText(), plan)
  assert.deepEqual(session.getActiveToolNames(), [])
  assert.deepEqual(toolEvents, [])
  assert.equal(fetchAttempts, 0)
  assert.deepEqual(readdirSync(cwd), ["index.html"])
  assert.equal(readFileSync(join(cwd, "index.html"), "utf8"), "<h1>Example development notes</h1>\n")
  assert.equal(existsSync(join(agentDir, "auth.json")), false)
  writeFileSync(join(evidenceDirectory, "pre-account-context.json"), JSON.stringify(contexts, null, 2))
  writeFileSync(join(evidenceDirectory, "pre-account-plan.txt"), `${plan}\n`)
} finally {
  unsubscribe()
  session.dispose()
  runtime.unregisterProvider("offline-fixture")
}
cli("remove", ["remove", packageDirectory])
const removedSettings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf8"))
assert(!hasLocalPackage(removedSettings))
await loader.reload()
assert.equal(loader.getSkills().skills.length, 0)
const result = {
  client: `${clientManifest.name}@${clientManifest.version}`, node: process.version,
  package: "@linkbunny/pi-skill@0.1.0", skillSHA256: createHash("sha256").update(skillText).digest("hex"),
  cliInstallListRemove: true, packageSkillDiscovered: true, diagnostics: 0,
  skillBodyExpandedThroughPrompt: true, scriptedPreAccountPlan: true,
  providerCalls, toolEvents: toolEvents.length, fetchAttempts, activeTools: 0,
  accountCredentialsUsed: false, workspaceUnchanged: true,
  limits: "Canned in-process provider; no real model planning, live LinkBunny authentication, API transport, marketplace, publication, or report acceptance.",
}
writeFileSync(join(evidenceDirectory, "acceptance.json"), `${JSON.stringify(result, null, 2)}\n`)
console.log(JSON.stringify(result))
