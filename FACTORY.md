# LinkBunny for Factory Droid

This prepares the LinkBunny Skill as one Factory Droid [plugin](https://docs.factory.com/harness/plugins) for the official [Factory plugins marketplace](https://github.com/Factory-AI/factory-plugins). The plugin holds the unchanged Skill at `skills/linkbunny/SKILL.md`, the MIT-0 `LICENSE`, a short [README](factory/README.md), and `.factory-plugin/plugin.json`. It has no hooks, droids, commands, MCP server, output styles, or automatic runs.

## Prepare the plugin

```sh
bun run prepare:factory -- /absolute/path/to/marketplace
bun run test:factory
```

If the directory has no `.factory-plugin/marketplace.json`, the generator creates a local marketplace for loading the plugin without the official catalog. Droid names a local marketplace after its directory, and the generator prints the matching install ID:

```sh
droid plugin marketplace add /absolute/path/to/marketplace
droid plugin install linkbunny@marketplace --scope user
```

If the directory is a checkout of `Factory-AI/factory-plugins`, the generator adds the contribution in that repository's layout:

- `plugins/linkbunny/` with the plugin files.
- A `skills/linkbunny` symlink to the plugin Skill, which the catalog's `check-skills` workflow requires.
- One `linkbunny` entry appended to `.factory-plugin/marketplace.json`, in the `marketing` category.

The generator refuses a marketplace that already has a LinkBunny plugin. The Skill and license must match the reviewed public source at commit `4d50cfeaa1ab4b40e1ccf304fd1dca6fb3c1b0f6`, the same pin as the [Kilo](KILO.md) and [Tessl](TESSL.md) packages. Droid reads only the marketplace entry, so `plugin.json` carries descriptive metadata. Updating the workflow requires reviewing a new public revision and updating the pin.

## Local validation

The contribution was applied to `Factory-AI/factory-plugins` at commit `8a5f8db2e350748b24e2ac7b4deb4db2a357c4d3` and exported as a clean checkout. The catalog's `check-skills` script accepts it. Droid CLI 1.3.0 ran in airgap mode with no network, no account, and an empty home directory. It added the checkout as a local marketplace, installed and enabled `linkbunny`, and copied the four plugin files unchanged. The interactive slash-command menu then listed `/linkbunny` as a custom skill with the Skill's description.

Loading the Skill body and running a session need a Factory account or a bring-your-own-key model, so neither was tested. These checks do not establish marketplace acceptance, natural Skill selection, or a model's compliance with the Skill's approval rules.

## Publishing gates

The official marketplace takes contributions as pull requests from a fork to its `master` branch. Opening the fork and pull request is a public action that needs separate owner approval. As of November 4, 2026, every merged pull request had added or changed Factory's own plugins, and 32 pull requests were open, most of them third-party plugins without review. After a merge, users install with `droid plugin install linkbunny@factory-plugins`. Until then, anyone can add a fork or local checkout as their own marketplace.
