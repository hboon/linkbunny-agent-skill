import { copyFile, mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { resolve, join } from "node:path"
import { fileURLToPath } from "node:url"

const repository = fileURLToPath(new URL("../", import.meta.url))
const destination = process.argv[2]
if (!destination) throw new Error("Usage: bun run pack:dsh -- <output-directory>")
const outputDirectory = resolve(destination)
await mkdir(outputDirectory, { recursive: true })
const stagingDirectory = await mkdtemp(join(outputDirectory, "package-source-"))
const manifest = JSON.parse(await readFile(join(repository, "package.json"), "utf8"))
delete manifest.scripts
await writeFile(join(stagingDirectory, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`)
for (const filename of ["cordis.patch.yml", "DSH.md", "dsh-safety.md", "MCP.md", "SKILL.md", "README.md", "LICENSE"]) {
  await copyFile(join(repository, filename), join(stagingDirectory, filename))
}
await mkdir(join(stagingDirectory, "skills/linkbunny"), { recursive: true })
const skill = await readFile(join(repository, "SKILL.md"), "utf8")
const safety = await readFile(join(repository, "dsh-safety.md"), "utf8")
await writeFile(join(stagingDirectory, "skills/linkbunny/SKILL.md"), `${skill}\n${safety}`)
const packed = Bun.spawnSync(["npm", "pack", "--ignore-scripts", "--json", "--pack-destination", outputDirectory], {
  cwd: stagingDirectory,
  stdout: "pipe",
  stderr: "pipe",
})
if (packed.exitCode !== 0) throw new Error(packed.stderr.toString())
const [result] = JSON.parse(packed.stdout.toString())
console.log(JSON.stringify({ artifact: join(outputDirectory, result.filename), source: stagingDirectory, files: result.files.map((file: { path: string }) => file.path) }, null, 2))
