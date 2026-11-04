# LinkBunny for Tessl

This prepares the LinkBunny Skill as one Tessl plugin for the [Tessl Registry](https://tessl.io/registry). The plugin root holds the unchanged `SKILL.md` and `LICENSE`, a short registry [README](tessl/README.md), and `.tessl-plugin/plugin.json`. It has no hooks, MCP server, commands, rules, eval scenarios, or automatic runs.

## Prepare the plugin

```sh
bun run prepare:tessl -- /absolute/path/to/output <tessl-workspace>
bun run test:tessl
```

The generator creates `linkbunny-tessl-*/` for plugin `<tessl-workspace>/linkbunny`, version `0.1.1`, with public visibility (`"private": false`). Version 0.1.0 was published privately; 0.1.1 carries the same Skill for public release. This is the layout `tessl skill import` produces for a single Skill: the plugin root contains `SKILL.md`, with `"skills": ["."]`. The generator adds the license, homepage, repository, and author fields and a plugin description.

The Skill and license must match the reviewed public source at commit `4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6`, the same pin as the [Kilo import](KILO.md). The generator refuses a local copy that differs. Updating the workflow requires reviewing a new public revision and updating the pin.

## Local validation

Tessl CLI 0.119.0 ran without network access, authentication, or credits. `tessl plugin lint`, `tessl skill lint`, and `tessl plugin pack` accept the prepared plugin. Lint warns that the canonical Skill is about 5,100 tokens, against a recommended 5,000. The packed archive contains the four files plus a `tile.json` that Tessl generates for compatibility.

Installing from a local `file:` source still calls Tessl's online install policy service, so no agent installation or Skill loading was tested. Lint and pack results do not establish registry acceptance, review scores, natural Skill selection, or a model's compliance with the Skill's approval rules.

## Publishing gates

Each step below needs separate owner approval.

1. Before publishing, check the registry again for an indexed copy of `hboon/linkbunny-agent-skill`. If one exists, use Tessl's [claim path](https://docs.tessl.io/distribute/promote-or-claim-a-skill-you-have-created#claim-a-tessl-skill) instead of publishing a duplicate.
2. Choose the Tessl account and workspace, then sign in. Tessl's terms apply to account use.
3. Run `tessl plugin publish --dry-run` with that workspace, then publish privately. Publishing is free. Tessl runs a free automatic review and asynchronous publication checks; a version may remain blocked or pending.
4. Public visibility needs `"private": false` and a new version. Tessl's docs also describe a **Make Public** request in the registry, but on 2026-11-04 the registry offered no such action; the workspace setting "Block public plugin publishing" was off, so the publish itself carried the change. Tessl's sharing guide says public plugins cannot be made private again, so treat exposure as permanent.
5. Public content gives Tessl and its users a license to the content. Public content in a Free Plan workspace may also be used to train Tessl's models unless training is turned off in account settings. The Skill is already public under MIT-0.

Evaluations and agent runs consume credits and are not needed for the listing.
