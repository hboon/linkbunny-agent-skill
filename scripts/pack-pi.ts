import { copyFile, mkdir, mkdtemp, stat } from "node:fs/promises"
import { resolve, join } from "node:path"
import { fileURLToPath } from "node:url"

const repository = fileURLToPath(new URL("../", import.meta.url))
const destination = process.argv[2]
if (!destination) throw new Error("Usage: bun run pack:pi -- <output-directory>")
const outputDirectory = resolve(destination)
await mkdir(outputDirectory, { recursive: true })
const stagingDirectory = await mkdtemp(join(outputDirectory, "pi-package-source-"))
await copyFile(join(repository, "pi/package.json"), join(stagingDirectory, "package.json"))
await copyFile(join(repository, "PI.md"), join(stagingDirectory, "README.md"))
await copyFile(join(repository, "LICENSE"), join(stagingDirectory, "LICENSE"))
await mkdir(join(stagingDirectory, "skills/linkbunny"), { recursive: true })
await copyFile(join(repository, "SKILL.md"), join(stagingDirectory, "skills/linkbunny/SKILL.md"))
const packed = Bun.spawnSync(["npm", "pack", "--ignore-scripts", "--json", "--pack-destination", outputDirectory], {
  cwd: stagingDirectory,
  stdout: "pipe",
  stderr: "pipe",
})
if (packed.exitCode !== 0) throw new Error(packed.stderr.toString())
const [result] = JSON.parse(packed.stdout.toString())
const artifact = join(outputDirectory, result.filename.replace(/^@([^/]+)\//, "$1-"))
await stat(artifact)
console.log(JSON.stringify({ artifact, source: stagingDirectory, files: result.files.map((file: { path: string }) => file.path) }, null, 2))
