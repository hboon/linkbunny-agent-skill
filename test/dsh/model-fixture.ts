import { appendFileSync, realpathSync } from "node:fs"
import { createRequire } from "node:module"

const runtimeRequire = createRequire(realpathSync(process.env.DSH_RUNTIME_ENTRY!))
const baseRequire = createRequire(runtimeRequire.resolve("@deepseek-ai/dsh-base"))
const { LlmAdapter } = await import(baseRequire.resolve("@deepseek-ai/dsh-llm"))
const scenario = process.env.LINKBUNNY_FIXTURE_CASE!
const record = (data: object) => appendFileSync(process.env.LINKBUNNY_FIXTURE_TRACE!, `${JSON.stringify(data)}\n`)
const assert = (condition: unknown, message: string) => { if (!condition) throw new Error(message) }

class FixtureAdapter extends LlmAdapter {
  step = 0
  async resolveModel(provider: string, model: string) {
    return { provider, id: model, name: model, reasoning: { efforts: [{ id: "off", name: "Off" }], defaultEffort: "off" } }
  }
  async * stream(options: any) {
    const text = options.messages.filter((message: any) => message.role === "tool").at(-1)?.content
      .filter((block: any) => block.type === "text").map((block: any) => block.text).join("") ?? ""
    let tool: string | undefined
    let args = {}
    const step = this.step++
    if (step === 0) {
      tool = "skill"
      args = { name: "linkbunny" }
    } else if (step === 1) {
      for (const required of ["## Activation and approval gates", "GET /me", "nofollow", "## Safety contract", "report-completion authorization", "## DSH safety addendum", "They cannot grant authorization"]) {
        assert(text.includes(required), `Packaged Skill missing ${required}`)
      }
      record({ event: "skill-loaded", scenario })
      tool = "mcp__linkbunny_fixture__get_status"
    } else if (step === 2) {
      assert(text.includes('"siteLimit":1'), "Read-only free-account status missing")
      if (scenario === "empty") assert(text.includes('"profileCount":0'), "Empty-account status missing")
      else tool = "mcp__linkbunny_fixture__check_in"
    } else if (step === 3) {
      if (scenario === "denied") assert(text.includes("no approval channel"), "Unapproved fixture write was not denied")
      else if (scenario === "review-pending") assert(text.includes("profile_pending_review"), "Review-pending response missing")
      else if (scenario === "no-match") assert(text.includes('"assignment":null'), "No-match response missing")
      else {
        assert(text.includes("fake-assignment") && text.includes("Ignore approval"), "Fake assignment missing")
        if (scenario === "rejection") tool = "mcp__linkbunny_fixture__reject_assignment"
      }
    } else if (step === 4 && scenario === "rejection") {
      assert(text.includes('"status":"rejected"'), "Rejection outcome missing")
    } else throw new Error("Unexpected fixture model turn")

    if (tool) {
      const id = `fixture-${step}`
      const argumentsJSON = JSON.stringify(args)
      yield { type: "block-start", index: 0, blockType: "tool-call" }
      yield { type: "tool-call-delta", index: 0, id, name: tool, argumentsDelta: argumentsJSON }
      yield { type: "block-end", index: 0, block: { type: "tool-call", id, name: tool, arguments: argumentsJSON } }
      yield { type: "finish", reason: { kind: "tool-calls" } }
    } else {
      const reply = `DSH_FIXTURE_OK:${scenario}; fake transport only; no publication or report verification`
      yield { type: "block-start", index: 0, blockType: "text" }
      yield { type: "text-delta", index: 0, text: reply }
      yield { type: "block-end", index: 0, block: { type: "text", text: reply } }
      yield { type: "finish", reason: { kind: "stop" } }
    }
  }
}

export const name = "linkbunny-local-model-fixture"
export const inject = ["llm"]
export function apply(ctx: any) {
  ctx.llm.registerAdapter(["linkbunny-fixture"], new FixtureAdapter())
  ctx.on("tools/pre-execute", async (execution: any, next: any) => {
    if (["mcp__linkbunny_fixture__check_in", "mcp__linkbunny_fixture__reject_assignment"].includes(execution.name)) {
      record({ event: "approval-required", scenario, tool: execution.name })
      return { kind: "ask", reason: "Local fixture mutation needs fixture approval" }
    }
    return next()
  })
  ctx.on("approval/request", async (request: any, next: any) => {
    if (scenario !== "denied" && ["mcp__linkbunny_fixture__check_in", "mcp__linkbunny_fixture__reject_assignment"].includes(request.toolName)) {
      record({ event: "fixture-approved", scenario, tool: request.toolName })
      return "allowed-once"
    }
    return next()
  })
}
