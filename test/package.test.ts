import { expect, test } from "bun:test"
import { mkdtemp, readFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("packed bundle preserves the API Skill with DSH safety and no executable package hooks", async () => {
  const output = await mkdtemp(join(process.env.LINKBUNNY_TEST_ARTIFACTS ?? tmpdir(), "linkbunny-package-"))
  const packed = Bun.spawnSync(["bun", "scripts/pack-dsh.ts", output], { stdout: "pipe", stderr: "pipe" })
  expect(packed.exitCode).toBe(0)
  const { artifact, source, files } = JSON.parse(packed.stdout.toString())
  const extracted = Bun.spawnSync(["tar", "-xOzf", artifact, "package/skills/linkbunny/SKILL.md"], { stdout: "pipe" })
  expect(extracted.exitCode).toBe(0)
  expect(extracted.stdout.toString()).toBe(`${await readFile("SKILL.md", "utf8")}\n${await readFile("dsh-safety.md", "utf8")}`)
  const manifest = JSON.parse(await readFile(join(source, "package.json"), "utf8"))
  expect(manifest.dsh.bundle.patch).toBe("./cordis.patch.yml")
  expect(manifest.engines.dsh).toBe("0.2.1-rc.5")
  expect(manifest.scripts).toBeUndefined()
  expect(manifest.dependencies).toBeUndefined()
  expect(files).toEqual(expect.arrayContaining(["package.json", "LICENSE", "DSH.md", "cordis.patch.yml", "skills/linkbunny/SKILL.md"]))
  expect(files.some((file: string) => file.includes(".env") || file.startsWith("test/") || file.startsWith("scripts/"))).toBe(false)
})
