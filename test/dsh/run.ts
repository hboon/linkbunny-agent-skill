import { spawnSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"

const entry = process.env.DSH_RUNTIME_ENTRY!
const artifact = process.argv[2]
const output = process.argv[3]
if (!entry || !artifact || !output) throw new Error("Set DSH_RUNTIME_ENTRY; pass <tarball> <output-directory> inside an isolated container with networking disabled")
mkdirSync(output, { recursive: true })
const fixtures = dirname(new URL(import.meta.url).pathname)
const run = (name: string, args: string[], extraEnvironment: object = {}) => {
  const result = spawnSync(process.execPath, [entry, ...args], {
    cwd: "/workspace",
    env: { ...process.env, ...extraEnvironment },
    encoding: "utf8",
    timeout: 60_000,
    maxBuffer: 4_000_000,
  })
  writeFileSync(join(output, `${name}.stdout.log`), result.stdout ?? "")
  writeFileSync(join(output, `${name}.stderr.log`), result.stderr ?? "")
  if (result.status !== 0 || result.error) throw new Error(`${name} failed; inspect ${output}/${name} logs: ${result.error ?? result.status}`)
  return result.stdout
}

run("install", ["plugin", "--profile", "headless", "add", artifact, "--ignore-scripts", "--workspace-root", "--offline", "--store-dir", "/runtime/store"])
const config = run("config", ["--profile", "headless", "--dump-config"])
if (!config.includes("linkbunny-skills") || !config.includes("linkbunny-dsh")) throw new Error("Installed bundle missing from composed configuration")
const overlay = join(output, "fixture.patch.yml")
writeFileSync(overlay, `
- id: agent-default-model
  config:
    provider: linkbunny-fixture
    model: fixture
- id: skill-filesystem
  config:
    includeDefaultRoots: false
    watch: false
- id: session-log-deepseek
  disabled: true
- id: session-title-llm
  disabled: true
- insert:
    - id: linkbunny-local-model-fixture
      name: ${join(fixtures, "model-fixture.ts")}
    - id: linkbunny-local-mcp-fixture
      name: '@deepseek-ai/dsh-mcp-client'
      config:
        serverName: linkbunny_fixture
        transport: stdio
        command: ${process.execPath}
        args: [${join(fixtures, "mcp-fixture.ts")}]
        env:
          LINKBUNNY_FIXTURE_CASE: !!js process.env.LINKBUNNY_FIXTURE_CASE
          LINKBUNNY_FIXTURE_TRACE: !!js process.env.LINKBUNNY_FIXTURE_TRACE
        reconnect:
          enabled: false
        failOnStartupError: true
`)
const results = []
for (const scenario of ["empty", "review-pending", "no-match", "exchange", "denied", "rejection"]) {
  const trace = join(output, `${scenario}.jsonl`)
  writeFileSync(trace, "")
  const stdout = run(scenario, ["--profile", "headless", "--patch", overlay, "Run the local LinkBunny fixture only", "--json"], {
    LINKBUNNY_FIXTURE_CASE: scenario,
    LINKBUNNY_FIXTURE_TRACE: trace,
  })
  if (!stdout.includes(`DSH_FIXTURE_OK:${scenario}`)) throw new Error(`${scenario} did not finish its fixture assertions`)
  const events = readFileSync(trace, "utf8").trim().split("\n").map(line => JSON.parse(line))
  const dispatched = events.filter(event => event.event === "dispatch").map(event => event.tool)
  const expected = scenario === "empty" || scenario === "denied" ? ["get_status"]
    : scenario === "rejection" ? ["get_status", "check_in", "reject_assignment"] : ["get_status", "check_in"]
  if (JSON.stringify(dispatched) !== JSON.stringify(expected)) throw new Error(`${scenario} dispatched unexpected fixture operations`)
  if (!events.some(event => event.event === "skill-loaded")) throw new Error("Skill did not load")
  if (scenario === "denied" && (!events.some(event => event.event === "approval-required") || events.some(event => event.event === "fixture-approved"))) throw new Error("Denial test did not exercise the fixture gate")
  results.push({ scenario, dispatched, skillLoaded: true })
}
writeFileSync(join(output, "acceptance.json"), JSON.stringify({ client: "@deepseek-ai/dsh@0.2.1-rc.5", model: "deterministic local fixture", approvalGate: "fixture-only", results }, null, 2))
console.log(JSON.stringify({ passed: results.length, client: "0.2.1-rc.5", output }))
