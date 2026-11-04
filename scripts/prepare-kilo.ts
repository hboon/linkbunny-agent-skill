import { copyFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repository = fileURLToPath(new URL("../", import.meta.url))
const sourceCommit = "4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6"
const destination = process.argv[2]
if (!destination) throw new Error("Usage: bun run prepare:kilo -- <output-directory>")

function sourceGit(...args: string[]) {
  const result = Bun.spawnSync(["git", ...args], { cwd: repository, stdout: "pipe", stderr: "pipe" })
  if (result.exitCode !== 0) throw new Error(result.stderr.toString())
  return result.stdout.toString()
}

const skill = await readFile(join(repository, "SKILL.md"), "utf8")
const license = await readFile(join(repository, "LICENSE"), "utf8")
for (const [filename, content] of [["SKILL.md", skill], ["LICENSE", license]]) {
  if (sourceGit("show", `${sourceCommit}:${filename}`) !== content) {
    throw new Error(`${filename} differs from the pinned public source; review and update the source pin before importing`)
  }
}
const frontmatter = skill.match(/^---\nname: linkbunny\n(description: [^\n]+)\n---\n/)
if (!frontmatter) throw new Error("Unexpected canonical Skill frontmatter; review the import metadata")
const metadata = [
  "metadata:",
  "  category: business",
  "  author: hboon",
  "  source:",
  "    repository: https://github.com/hboon/linkbunny-agent-skill",
  '    path: "."',
  "    license_path: LICENSE",
  `    ref: ${sourceCommit}`,
  `    commit: ${sourceCommit}`,
].join("\n")
const importedSkill = skill.replace(frontmatter[0], `---\nname: linkbunny\n${frontmatter[1]}\n${metadata}\n---\n`)
const excludedEntries = sourceGit("ls-tree", "--name-only", sourceCommit).trim().split("\n")
  .filter((entry) => entry !== "SKILL.md" && entry !== "LICENSE")
const outputDirectory = resolve(destination)
await mkdir(outputDirectory, { recursive: true })
const contributionDirectory = await mkdtemp(join(outputDirectory, "kilo-marketplace-source-"))
const skillDirectory = join(contributionDirectory, "skills/linkbunny")
await mkdir(skillDirectory, { recursive: true })
await writeFile(join(skillDirectory, "SKILL.md"), importedSkill)
await copyFile(join(repository, "LICENSE"), join(skillDirectory, "LICENSE"))
await writeFile(join(skillDirectory, "local.remove"), `${excludedEntries.join("\n")}\n`)
console.log(JSON.stringify({ contributionDirectory, skillDirectory, sourceCommit, sourcePath: ".", files: ["SKILL.md", "LICENSE", "local.remove"] }, null, 2))
