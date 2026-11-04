# Local DSH acceptance fixture

These files test the bundle in the actual `@deepseek-ai/dsh@0.2.1-rc.5` headless client. The model is a deterministic local adapter. The MCP server exposes fake status, check-in and rejection operations only. It has no network, account, website, publication or report implementation.

Use a disposable Linux container with networking disabled, Node.js 24.22.1, pnpm 9.2.0 and the previously audited, scripts-disabled DSH dependency tree. Mount only task-owned files. Do not mount a real home, credentials, Docker socket, project environment files or other services.

The runner expects the installed client and offline pnpm store under `/runtime`, an empty `/workspace`, these files under `/fixtures`, and the built tarball under `/bundle`. In that isolated environment, set fresh `HOME`, `DSH_HOME` and `DSH_AGENTS_HOME`, `DSH_TELEMETRY_DISABLED=1`, `DSH_PERMISSION_MODE=workspace-write`, and `DSH_RUNTIME_ENTRY=/runtime/node_modules/@deepseek-ai/dsh/lib/bin.js`. Put pnpm on `PATH`, then run:

```sh
node /fixtures/run.ts /bundle/linkbunny-dsh-0.1.0.tgz /runtime/acceptance
```

The runner installs the tarball offline with scripts disabled, checks composed configuration and launches six headless cases. It loads the packaged Skill through DSH's `skill` tool before exercising fake transport. Logs, dispatch traces and `acceptance.json` stay in the output directory. Telemetry, session-log contribution and default skill roots are disabled for runtime cases.

The fixture adds an approval policy because DSH's MCP bridge does not turn tool annotations into approval gates. One case has no answerer and must deny the write before transport. Other cases grant only the named fake operation once. These grants are test inputs, never owner permission or a product safeguard. The included untrusted assignment text is data in a scripted test; this does not establish a live model's resistance to prompt injection.
