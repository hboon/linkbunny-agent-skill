# LinkBunny for Kilo

Use the LinkBunny Skill to plan contextual nofollow exchanges for sites you control. Review each placement and approve publication through your site's normal workflow. A LinkBunny account and API token are required; the first exchange on one site is free with no card. The paid plan covers up to 10 sites.

## Load the Skill locally

Copy the repository's `SKILL.md` and `LICENSE` into your project's `.kilo/skills/linkbunny/` directory. In Kilo, ask:

```text
Use LinkBunny to plan setup for my site. I have no account or API token. Propose the target and inventory URLs first, and wait for my approval before registering the site or checking for an assignment.
```

Kilo discovers the Skill's name and description, then loads its instructions when selected. Follow the [canonical Skill](https://getlinkbunny.com/skill.md) for account setup. Save the API token in an approved private secret store. Never put a token in chat, catalog metadata, or tracked Kilo configuration.

Account, billing, credential, site, check-in, publication, reporting, and rejection actions retain the Skill's approval requirements. An assignment permits consideration within its inventory boundary; it does not authorize publication. Reporting requires separate approval after inspecting the published nofollow link.

The Skill states these rules in text. Configure Kilo's tool permissions and review tool activity accordingly; this import adds no approval enforcement, plugin, MCP server, hooks, or runtime dependencies.

## Prepare the marketplace contribution

```sh
bun run prepare:kilo -- /absolute/path/to/output
bun run test:kilo
```

The generator creates `kilo-marketplace-source-*/skills/linkbunny/` with three files:

- `SKILL.md`, with the source description and workflow unchanged, plus Kilo's `business` category, author, and source metadata.
- `LICENSE`, copied unchanged under MIT-0.
- `local.remove`, listing unrelated root entries that Kilo's updater must exclude. Kilo excludes this control file from the installed archive.

The source is the already-public repository root at commit `4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6`. Both `metadata.source.ref` and `commit` contain that revision. Kilo fetches `ref`; `commit` records what it imported. The generator reads the Skill and license from that commit, so later root changes do not alter the import. Updating the workflow requires reviewing a new public revision and updating the pin.

Kilo Marketplace's updater supports `metadata.source.path: "."`. Its stock URL importer infers the root directory's name as `.` and cannot create the intended catalog entry. Prepare the named `skills/linkbunny/` entry manually, then run the marketplace updater and validators. No nested source package is needed. These semantics were checked against [marketplace revision 6c1b454](https://github.com/Kilo-Org/kilo-marketplace/tree/6c1b4543cac1d45a80bf5904e4b69ac315117323).

The command prepares local files. Marketplace publication and any public source changes are separate steps. The DSH and Pi packages remain separate contributions.

## Acceptance and limits

The [offline fixture](test/kilo/README.md) tests the shipped Kilo CLI 7.8.18 with a scripted local model provider: Skill discovery, catalog metadata, on-demand body loading, denied Skill loading, and a denied shell action. No LinkBunny token, customer data, paid inference, or live exchange is needed.

A scripted provider chooses the Skill itself. These checks do not establish natural model selection or a model's compliance with every approval instruction. LinkBunny authentication, exchange activity, publication, marketplace installation, and the VS Code interface require separate acceptance. Read the [agent setup guide](https://getlinkbunny.com/docs/agents) for the API-token workflow.
