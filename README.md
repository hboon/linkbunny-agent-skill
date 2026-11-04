# LinkBunny agent skill

A coding-agent workflow for relevant, owner-approved `nofollow` link placements through [LinkBunny](https://getlinkbunny.com/docs/agents?utm_source=github_skill&utm_medium=repository). The agent reviews an assignment and proposes a contextual placement; the site owner approves publication through their normal workflow. LinkBunny does not edit sites.

The installable [SKILL.md](SKILL.md) is a distribution copy of the [canonical public workflow](https://getlinkbunny.com/skill.md). The private GetLinkBunny application repository remains its authored source. Run `bun scripts/sync.ts` to regenerate this copy from the public canonical workflow, then review the diff before publishing an update.

An account and API token are required. A new account can try its first exchange free for one site, with no card. A paid subscription removes the free exchange limits and covers up to 10 sites.

The workflow requires approval for account, billing, credential, site, assignment, publication, reporting, and rejection actions. Never put an API token in a prompt or tracked file.

The separate [local stdio MCP package](https://www.npmjs.com/package/@linkbunny/mcp) is published on npm as `@linkbunny/mcp` and on the official MCP Registry as `com.getlinkbunny/exchange`. Its [setup and authentication guide](https://getlinkbunny.com/docs/agents?utm_source=github_skill&utm_medium=repository#mcp) explains client registration and the six available tools. [MCP package details](MCP.md) describe the published artifact. This repository does not contain the MCP server source or provide a hosted MCP endpoint.

The skill is distributed under [MIT-0](LICENSE). The npm MCP package has its own MIT license.

A [DeepSeek Harness bundle](DSH.md) packages this same Skill for the pinned DSH client. Build its tarball with `bun run pack:dsh -- /absolute/path/to/output`; the setup guide includes installation, authentication boundaries, and local verification limits. It does not install the separate MCP server.
