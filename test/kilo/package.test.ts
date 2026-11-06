import { expect, test } from "bun:test"
import { mkdtemp, readFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const sourceCommit = "4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6"
const pinned = (filename: string) => Bun.spawnSync(["git", "show", `${sourceCommit}:${filename}`], { stdout: "pipe" }).stdout.toString()

test("Kilo root-source contribution preserves the public Skill and license without unrelated packaging", async () => {
  const output = await mkdtemp(join(process.env.LINKBUNNY_TEST_ARTIFACTS ?? tmpdir(), "linkbunny-kilo-"))
  const prepared = Bun.spawnSync(["bun", "scripts/prepare-kilo.ts", output], { stdout: "pipe", stderr: "pipe" })
  expect(prepared.exitCode).toBe(0)
  const { skillDirectory, sourceCommit: preparedCommit, sourcePath } = JSON.parse(prepared.stdout.toString())
  expect(preparedCommit).toBe(sourceCommit)
  expect(sourcePath).toBe(".")
  expect((await readdir(skillDirectory)).sort()).toEqual(["LICENSE", "SKILL.md", "local.remove"])
  const canonical = pinned("SKILL.md")
  const imported = await readFile(join(skillDirectory, "SKILL.md"), "utf8")
  const body = (text: string) => text.replace(/^---\n[\s\S]*?\n---\n/, "")
  expect(body(imported)).toBe(body(canonical))
  expect(imported.match(/^description: .+$/m)?.[0]).toBe(canonical.match(/^description: .+$/m)?.[0])
  expect(imported).toContain('    path: "."')
  expect(imported).toContain(`    ref: ${sourceCommit}\n    commit: ${sourceCommit}`)
  expect(imported).not.toMatch(/^(requirements|allowed-tools):/m)
  expect(await readFile(join(skillDirectory, "LICENSE"), "utf8")).toBe(pinned("LICENSE"))
  const sourceEntries = Bun.spawnSync(["git", "ls-tree", "--name-only", sourceCommit], { stdout: "pipe" })
  expect(sourceEntries.exitCode).toBe(0)
  const excluded = (await readFile(join(skillDirectory, "local.remove"), "utf8")).trim().split("\n")
  expect(sourceEntries.stdout.toString().trim().split("\n").filter((entry) => !excluded.includes(entry))).toEqual(["LICENSE", "SKILL.md"])
})
