import { mkdir, readFile, writeFile } from "node:fs/promises"

const skill = await readFile(new URL("../SKILL.md", import.meta.url), "utf8")
const safety = await readFile(new URL("../dsh-safety.md", import.meta.url), "utf8")
await mkdir(new URL("../skills/linkbunny/", import.meta.url), { recursive: true })
await writeFile(new URL("../skills/linkbunny/SKILL.md", import.meta.url), `${skill}\n${safety}`)
