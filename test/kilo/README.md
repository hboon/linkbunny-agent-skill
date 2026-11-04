# Offline Kilo acceptance

`package.test.ts` checks the manual root-source catalog import, source pin, unchanged workflow and MIT-0 license, and exclusions for unrelated repository files. Run `bun run test:kilo`.

`run.ts` exercises the shipped `@kilocode/cli-linux-arm64@7.8.18` binary. Keep the package's `bin/` resources beside the executable. The matching source is Kilo-Org/kilocode tag `v7.8.18`, commit `b81761530650f8ec7b071441f4f54d2514f1a244`.

Audit the pinned vendor code and packages before executing them. Run the fixture in a disposable non-root Linux container with networking disabled, a read-only root, dropped capabilities, no-new-privileges, and resource limits. Mount only task-owned fixtures, the client, the public Skill, and an output directory. Do not mount a host home, credentials, project environment files, browser profile, or Docker socket. Bypass the npm package's postinstall script.

With Node.js 24.22.1, ripgrep on `PATH`, an empty writable `/work`, and the binary at `/opt/kilo/bin/kilo`, run:

```sh
node /fixtures/run.ts /path/to/extracted/linkbunny /evidence
```

The fixture creates isolated home and XDG directories, disables project configuration, plugins, updates, model downloads, Skill shell expansion, and telemetry, and supplies empty auth. Its only provider uses a fake key and an HTTP server on the container's loopback interface. No model inference occurs. It retains requests, client output, and `acceptance.json`.

Checks cover discovery through `kilo debug skill`, metadata before activation, the `skill` tool's body loading, and permission rejection without `--auto` or other permission bypasses. The marker-writing shell action is a disposable test; it never calls LinkBunny or changes a site. The planning answer is scripted and cannot establish model judgment or instruction compliance.

Marketplace acceptance separately runs the pinned updater against a local public Git fixture, `skills-ref validate skills/linkbunny`, catalog generation, generator tests and type checks, and the marketplace archive recipe. The reference validator checks the imported directory name and frontmatter. It does not verify source identity or runtime behavior.
