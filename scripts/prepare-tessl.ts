import { copyFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repository = fileURLToPath(new URL("../", import.meta.url))
const sourceCommit = "4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6"
const [destination, workspace] = process.argv.slice(2)
if (!destination || !workspace) throw new Error("Usage: bun run prepare:tessl -- <output-directory> <tessl-workspace>")
if (!/^[a-z0-9][a-z0-9-]*$/.test(workspace)) throw new Error(`Invalid Tessl workspace name: ${workspace}`)

function sourceGit(...args: string[]) {
  const result = Bun.spawnSync(["git", ...args], { cwd: repository, stdout: "pipe", stderr: "pipe" })
  if (result.exitCode !== 0) throw new Error(result.stderr.toString())
  return result.stdout.toString()
}

for (const filename of ["SKILL.md", "LICENSE"]) {
  if (sourceGit("show", `${sourceCommit}:${filename}`) !== await readFile(join(repository, filename), "utf8")) {
    throw new Error(`${filename} differs from the pinned public source; review and update the source pin before importing`)
  }
}
const manifest = {
  name: `${workspace}/linkbunny`,
  version: "0.1.0",
  description: "Contextual nofollow link exchanges for sites you control, handled with your coding agent and your approval.",
  private: true,
  skills: ["."],
  license: "MIT-0",
  homepage: "https://getlinkbunny.com/docs/agents",
  repository: "https://github.com/hboon/linkbunny-agent-skill",
  author: { name: "LinkBunny", url: "https://getlinkbunny.com" },
}
const outputDirectory = resolve(destination)
await mkdir(outputDirectory, { recursive: true })
const pluginDirectory = await mkdtemp(join(outputDirectory, "linkbunny-tessl-"))
await mkdir(join(pluginDirectory, ".tessl-plugin"))
await writeFile(join(pluginDirectory, ".tessl-plugin/plugin.json"), `${JSON.stringify(manifest, null, 2)}\n`)
await copyFile(join(repository, "SKILL.md"), join(pluginDirectory, "SKILL.md"))
await copyFile(join(repository, "LICENSE"), join(pluginDirectory, "LICENSE"))
await copyFile(join(repository, "tessl/README.md"), join(pluginDirectory, "README.md"))
console.log(JSON.stringify({ pluginDirectory, name: manifest.name, version: manifest.version, sourceCommit, files: [".tessl-plugin/plugin.json", "SKILL.md", "LICENSE", "README.md"] }, null, 2))
