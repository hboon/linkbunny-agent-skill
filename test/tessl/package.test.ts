import { expect, test } from "bun:test"
import { mkdtemp, readFile, readdir } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

const sourceCommit = "4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6"
const pinned = (filename: string) => Bun.spawnSync(["git", "show", `${sourceCommit}:${filename}`], { stdout: "pipe" }).stdout.toString()

test("Tessl plugin ships the pinned Skill and license with public metadata", async () => {
  const output = await mkdtemp(join(process.env.LINKBUNNY_TEST_ARTIFACTS ?? tmpdir(), "linkbunny-tessl-"))
  const prepared = Bun.spawnSync(["bun", "scripts/prepare-tessl.ts", output, "example-workspace"], { stdout: "pipe", stderr: "pipe" })
  expect(prepared.exitCode).toBe(0)
  const { pluginDirectory, sourceCommit: preparedCommit } = JSON.parse(prepared.stdout.toString())
  expect(preparedCommit).toBe(sourceCommit)
  expect((await readdir(pluginDirectory, { recursive: true })).sort()).toEqual([".tessl-plugin", ".tessl-plugin/plugin.json", "LICENSE", "README.md", "SKILL.md"])
  for (const filename of ["SKILL.md", "LICENSE"]) {
    expect(await readFile(join(pluginDirectory, filename), "utf8")).toBe(pinned(filename))
  }
  expect(await readFile(join(pluginDirectory, "README.md"), "utf8")).toBe(await readFile("tessl/README.md", "utf8"))
  const manifest = JSON.parse(await readFile(join(pluginDirectory, ".tessl-plugin/plugin.json"), "utf8"))
  expect(manifest).toMatchObject({ name: "example-workspace/linkbunny", version: "0.1.1", private: false, skills: ["."], license: "MIT-0" })
  expect(Object.keys(manifest).sort()).toEqual(["author", "description", "homepage", "license", "name", "private", "repository", "skills", "version"])
})

test("Tessl preparation rejects an invalid workspace name", () => {
  const prepared = Bun.spawnSync(["bun", "scripts/prepare-tessl.ts", tmpdir(), "Bad/Workspace"], { stdout: "pipe", stderr: "pipe" })
  expect(prepared.exitCode).not.toBe(0)
})
