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

test("repository-root DSH Skill matches the packed Skill for source installs", async () => {
  const committed = await readFile("skills/linkbunny/SKILL.md", "utf8")
  expect(committed).toBe(`${await readFile("SKILL.md", "utf8")}\n${await readFile("dsh-safety.md", "utf8")}`)
  const listed = Bun.spawnSync(["npm", "pack", "--dry-run", "--ignore-scripts", "--json"], { stdout: "pipe", stderr: "pipe" })
  expect(listed.exitCode).toBe(0)
  const [{ files }] = JSON.parse(listed.stdout.toString())
  expect(files.map((file: { path: string }) => file.path)).toEqual(expect.arrayContaining(["package.json", "cordis.patch.yml", "skills/linkbunny/SKILL.md"]))
  const manifest = JSON.parse(await readFile("package.json", "utf8"))
  for (const script of ["preinstall", "install", "postinstall", "prepare", "prepack", "prepublish", "prepublishOnly", "publish"]) {
    expect(manifest.scripts[script]).toBeUndefined()
  }
})

test("Pi tarball contains only the canonical Skill, public docs, license, and Skill-only manifest", async () => {
  const output = await mkdtemp(join(process.env.LINKBUNNY_TEST_ARTIFACTS ?? tmpdir(), "linkbunny-pi-package-"))
  const packed = Bun.spawnSync(["bun", "scripts/pack-pi.ts", output], { stdout: "pipe", stderr: "pipe" })
  expect(packed.exitCode).toBe(0)
  const { artifact, files } = JSON.parse(packed.stdout.toString())
  expect(files.sort()).toEqual(["LICENSE", "README.md", "package.json", "skills/linkbunny/SKILL.md"])
  const extract = (filename: string) => {
    const result = Bun.spawnSync(["tar", "-xOzf", artifact, `package/${filename}`], { stdout: "pipe", stderr: "pipe" })
    if (result.exitCode !== 0) throw new Error(result.stderr.toString())
    return result.stdout.toString()
  }
  expect(extract("skills/linkbunny/SKILL.md")).toBe(await readFile("SKILL.md", "utf8"))
  expect(extract("README.md")).toBe(await readFile("PI.md", "utf8"))
  expect(extract("LICENSE")).toBe(await readFile("LICENSE", "utf8"))
  const manifest = JSON.parse(extract("package.json"))
  expect(manifest.name).toBe("@linkbunny/pi-skill")
  expect(manifest.version).toBe("0.1.0")
  expect(manifest.pi).toEqual({ skills: ["./skills"] })
  expect(manifest.keywords).toContain("pi-package")
  expect(manifest.publishConfig).toEqual({ access: "public" })
  for (const field of ["scripts", "bin", "main", "dependencies", "devDependencies", "optionalDependencies", "peerDependencies"]) {
    expect(manifest[field]).toBeUndefined()
  }
})
