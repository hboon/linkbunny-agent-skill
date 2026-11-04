import { copyFile, mkdir, readFile, stat, symlink, writeFile } from "node:fs/promises"
import { basename, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repository = fileURLToPath(new URL("../", import.meta.url))
const sourceCommit = "4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6"
const [destination] = process.argv.slice(2)
if (!destination) throw new Error("Usage: bun run prepare:factory -- <marketplace-directory>")

function sourceGit(...args: string[]) {
  const result = Bun.spawnSync(["git", ...args], { cwd: repository, stdout: "pipe", stderr: "pipe" })
  if (result.exitCode !== 0) throw new Error(result.stderr.toString())
  return result.stdout.toString()
}

async function exists(path: string) {
  return stat(path).then(() => true, () => false)
}

for (const filename of ["SKILL.md", "LICENSE"]) {
  if (sourceGit("show", `${sourceCommit}:${filename}`) !== await readFile(join(repository, filename), "utf8")) {
    throw new Error(`${filename} differs from the pinned public source; review and update the source pin before packaging`)
  }
}
const description = "Contextual nofollow link exchanges for sites you control, handled with your coding agent and your approval."
const manifest = {
  name: "linkbunny",
  version: "0.1.0",
  description,
  author: { name: "LinkBunny", url: "https://getlinkbunny.com" },
  homepage: "https://getlinkbunny.com/docs/agents",
  repository: "https://github.com/hboon/linkbunny-agent-skill",
  license: "MIT-0",
}
const entry = { name: "linkbunny", description, source: "./plugins/linkbunny", category: "marketing", homepage: manifest.homepage }

const marketplaceDirectory = resolve(destination)
const marketplacePath = join(marketplaceDirectory, ".factory-plugin/marketplace.json")
const marketplace = await exists(marketplacePath)
  ? JSON.parse(await readFile(marketplacePath, "utf8"))
  : { name: "linkbunny-local", description: "Local LinkBunny plugin marketplace", owner: { name: "LinkBunny" }, plugins: [] }
const pluginDirectory = join(marketplaceDirectory, "plugins/linkbunny")
const skillLink = join(marketplaceDirectory, "skills/linkbunny")
if (marketplace.plugins.some((plugin: { name: string }) => plugin.name === entry.name) || await exists(pluginDirectory) || await exists(skillLink)) {
  throw new Error(`${marketplaceDirectory} already contains a linkbunny plugin`)
}
marketplace.plugins.push(entry)

await mkdir(join(pluginDirectory, ".factory-plugin"), { recursive: true })
await mkdir(join(pluginDirectory, "skills/linkbunny"), { recursive: true })
await mkdir(join(marketplaceDirectory, "skills"), { recursive: true })
await mkdir(join(marketplaceDirectory, ".factory-plugin"), { recursive: true })
await writeFile(join(pluginDirectory, ".factory-plugin/plugin.json"), `${JSON.stringify(manifest, null, 2)}\n`)
await copyFile(join(repository, "SKILL.md"), join(pluginDirectory, "skills/linkbunny/SKILL.md"))
await copyFile(join(repository, "LICENSE"), join(pluginDirectory, "LICENSE"))
await copyFile(join(repository, "factory/README.md"), join(pluginDirectory, "README.md"))
await symlink("../plugins/linkbunny/skills/linkbunny", skillLink)
await writeFile(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`)
console.log(JSON.stringify({ marketplaceDirectory, marketplace: marketplace.name, plugin: `${entry.name}@${basename(marketplaceDirectory)}`, version: manifest.version, sourceCommit }, null, 2))
