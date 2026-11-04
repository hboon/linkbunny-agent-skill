import { expect, test } from "bun:test"
import { mkdtemp, readFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("Tessl plugin ships the pinned Skill and license with private metadata only", async () => {
  const output = await mkdtemp(join(process.env.LINKBUNNY_TEST_ARTIFACTS ?? tmpdir(), "linkbunny-tessl-"))
  const prepared = Bun.spawnSync(["bun", "scripts/prepare-tessl.ts", output, "example-workspace"], { stdout: "pipe", stderr: "pipe" })
  expect(prepared.exitCode).toBe(0)
  const { pluginDirectory } = JSON.parse(prepared.stdout.toString())
  expect((await readdir(pluginDirectory, { recursive: true })).sort()).toEqual([".tessl-plugin", ".tessl-plugin/plugin.json", "LICENSE", "README.md", "SKILL.md"])
  for (const [shipped, source] of [["SKILL.md", "SKILL.md"], ["LICENSE", "LICENSE"], ["README.md", "tessl/README.md"]]) {
    expect(await readFile(join(pluginDirectory, shipped), "utf8")).toBe(await readFile(source, "utf8"))
  }
  const manifest = JSON.parse(await readFile(join(pluginDirectory, ".tessl-plugin/plugin.json"), "utf8"))
  expect(manifest).toMatchObject({ name: "example-workspace/linkbunny", private: true, skills: ["."], license: "MIT-0" })
  expect(Object.keys(manifest).sort()).toEqual(["author", "description", "homepage", "license", "name", "private", "repository", "skills", "version"])
})

test("Tessl preparation rejects an invalid workspace name", () => {
  const prepared = Bun.spawnSync(["bun", "scripts/prepare-tessl.ts", tmpdir(), "Bad/Workspace"], { stdout: "pipe", stderr: "pipe" })
  expect(prepared.exitCode).not.toBe(0)
})
