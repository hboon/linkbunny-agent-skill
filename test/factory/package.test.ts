import { expect, test } from "bun:test"
import { mkdir, mkdtemp, readFile, readdir, readlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"

const artifacts = process.env.LINKBUNNY_TEST_ARTIFACTS ?? tmpdir()
const sourceCommit = "4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6"
const pinned = (filename: string) => Bun.spawnSync(["git", "show", `${sourceCommit}:${filename}`], { stdout: "pipe" }).stdout.toString()

function prepare(directory: string) {
  return Bun.spawnSync(["bun", "scripts/prepare-factory.ts", directory], { stdout: "pipe", stderr: "pipe" })
}

test("Factory plugin ships the pinned Skill and license in a local marketplace", async () => {
  const marketplaceDirectory = await mkdtemp(join(artifacts, "linkbunny-factory-"))
  const prepared = prepare(marketplaceDirectory)
  expect(prepared.exitCode).toBe(0)
  expect(JSON.parse(prepared.stdout.toString())).toMatchObject({ marketplace: "linkbunny-local", plugin: `linkbunny@${basename(marketplaceDirectory)}`, version: "0.1.0", sourceCommit })
  const pluginDirectory = join(marketplaceDirectory, "plugins/linkbunny")
  expect((await readdir(pluginDirectory, { recursive: true })).sort()).toEqual([".factory-plugin", ".factory-plugin/plugin.json", "LICENSE", "README.md", "skills", "skills/linkbunny", "skills/linkbunny/SKILL.md"])
  expect(await readFile(join(pluginDirectory, "skills/linkbunny/SKILL.md"), "utf8")).toBe(pinned("SKILL.md"))
  expect(await readFile(join(pluginDirectory, "LICENSE"), "utf8")).toBe(pinned("LICENSE"))
  expect(await readFile(join(pluginDirectory, "README.md"), "utf8")).toBe(await readFile("factory/README.md", "utf8"))
  const manifest = JSON.parse(await readFile(join(pluginDirectory, ".factory-plugin/plugin.json"), "utf8"))
  expect(manifest).toMatchObject({ name: "linkbunny", version: "0.1.0", license: "MIT-0" })
  expect(Object.keys(manifest).sort()).toEqual(["author", "description", "homepage", "license", "name", "repository", "version"])
  expect(await readlink(join(marketplaceDirectory, "skills/linkbunny"))).toBe("../plugins/linkbunny/skills/linkbunny")
  const marketplace = JSON.parse(await readFile(join(marketplaceDirectory, ".factory-plugin/marketplace.json"), "utf8"))
  expect(marketplace.plugins).toEqual([expect.objectContaining({ name: "linkbunny", source: "./plugins/linkbunny" })])
})

test("Factory preparation appends one entry to an existing marketplace and refuses a duplicate", async () => {
  const marketplaceDirectory = await mkdtemp(join(artifacts, "linkbunny-factory-existing-"))
  await mkdir(join(marketplaceDirectory, ".factory-plugin"))
  const existing = { name: "factory-plugins", owner: { name: "Factory" }, plugins: [{ name: "core", source: "./plugins/core", category: "core" }] }
  await writeFile(join(marketplaceDirectory, ".factory-plugin/marketplace.json"), `${JSON.stringify(existing, null, 2)}\n`)
  expect(prepare(marketplaceDirectory).exitCode).toBe(0)
  const marketplace = JSON.parse(await readFile(join(marketplaceDirectory, ".factory-plugin/marketplace.json"), "utf8"))
  expect(marketplace.name).toBe("factory-plugins")
  expect(marketplace.plugins.map((plugin: { name: string }) => plugin.name)).toEqual(["core", "linkbunny"])
  expect(prepare(marketplaceDirectory).exitCode).not.toBe(0)
})
