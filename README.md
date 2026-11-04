# LinkBunny agent skill

A coding-agent workflow for relevant, owner-approved `nofollow` link placements through [LinkBunny](https://getlinkbunny.com/docs/agents?utm_source=github_skill&utm_medium=repository). The agent reviews an assignment and proposes a contextual placement; the site owner approves publication through their normal workflow. LinkBunny does not edit sites.

The installable [SKILL.md](SKILL.md) is a distribution copy of the [canonical public workflow](https://getlinkbunny.com/skill.md). The private GetLinkBunny application repository remains its authored source. Run `bun scripts/sync.ts` to regenerate this copy from the public canonical workflow, then `bun run sync:dsh` to refresh the DSH copy, and review the diff before publishing an update.

An account and API token are required. A new account can try its first exchange free for one site, with no card. A paid subscription removes the free exchange limits and covers up to 10 sites.

The workflow requires approval for account, billing, credential, site, assignment, publication, reporting, and rejection actions. Never put an API token in a prompt or tracked file.

The separate [local stdio MCP package](https://www.npmjs.com/package/@linkbunny/mcp) is published on npm as `@linkbunny/mcp` and on the official MCP Registry as `com.getlinkbunny/exchange`. Its [setup and authentication guide](https://getlinkbunny.com/docs/agents?utm_source=github_skill&utm_medium=repository#mcp) explains client registration and the six available tools. [MCP package details](MCP.md) describe the published artifact. This repository does not contain the MCP server source or provide a hosted MCP endpoint.

The skill is distributed under [MIT-0](LICENSE). The npm MCP package has its own MIT license.

A [DeepSeek Harness bundle](DSH.md) packages this same Skill for the pinned DSH client. Build its tarball with `bun run pack:dsh -- /absolute/path/to/output`; the setup guide includes installation, authentication boundaries, and local verification limits. It does not install the separate MCP server.

A [Pi package](https://github.com/hboon/linkbunny-agent-skill/blob/main/PI.md) copies the same Skill into Pi's package layout. Build it with `bun run pack:pi -- /absolute/path/to/output`, then load the extracted local package. The guide covers pre-account planning, private token setup, owner approval, and verification limits. Public npm publication is a separate step.

A [Kilo import](https://github.com/hboon/linkbunny-agent-skill/blob/main/KILO.md) uses the existing root Skill without a second source package. Prepare its local marketplace contribution with `bun run prepare:kilo -- /absolute/path/to/output`. The guide covers source pinning, local loading, owner approval, and offline verification limits. Marketplace submission is a separate step.

A [Tessl plugin](https://github.com/hboon/linkbunny-agent-skill/blob/main/TESSL.md) packages the same Skill for the Tessl Registry. Prepare it with `bun run prepare:tessl -- /absolute/path/to/output <tessl-workspace>`. The guide covers source pinning, local validation limits, and the separate publishing and public-visibility steps.

A [Factory Droid plugin](https://github.com/hboon/linkbunny-agent-skill/blob/main/FACTORY.md) packages the same Skill for the official Factory plugins marketplace. Prepare a local marketplace or the marketplace contribution with `bun run prepare:factory -- /absolute/path/to/marketplace`. The guide covers source pinning, offline loading in Droid, and the separate pull-request step.
