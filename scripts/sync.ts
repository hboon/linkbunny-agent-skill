import { writeFile } from "node:fs/promises"

const canonicalURL = "https://getlinkbunny.com/skill.md"
const response = await fetch(canonicalURL, { signal: AbortSignal.timeout(10_000) })
if (!response.ok) throw new Error(`Canonical skill returned HTTP ${response.status}`)
const body = await response.text()
if (!body.startsWith("---\nname: linkbunny\n") || !body.includes("# LinkBunny agent skill\n") || body.length > 100_000) {
  throw new Error("Unexpected canonical skill content")
}
await writeFile(new URL("../SKILL.md", import.meta.url), body)
