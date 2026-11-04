# Offline Pi acceptance

This fixture runs the real `@earendil-works/pi-coding-agent@1.5.0` CLI and SDK on Node.js 24.22.1 for Linux. It installs the extracted local package, lists it, discovers the Skill through the installed package manifest, and expands `/skill:linkbunny` through `session.prompt`. An in-process provider returns a canned pre-account plan. The fixture then removes the package and checks that discovery clears.

The provider performs no inference or HTTP request. Its answer is written by the fixture. These checks establish client loading and message flow; they do not establish model judgment, automatic Skill selection, instruction compliance, API authentication, or exchange behavior. Owner approval is described by the unchanged Skill, with no runtime enforcement added by this package.

Audit the pinned client and dependencies before installation. Stage dependencies in a disposable environment with lifecycle scripts disabled. Keep the resulting lockfile. Execute acceptance in a separate non-root Linux container with networking disabled, a read-only root filesystem, dropped capabilities, no-new-privileges, and resource limits. Mount only task-owned runtime and fixture inputs read-only, and a task-owned evidence directory writable. Never mount a host home, credential directory, environment file, Docker socket, or project checkout.

The fixture expects an empty writable `/work`, `HOME=/work/home`, `PI_CODING_AGENT_DIR=/work/agent`, `PI_OFFLINE=1`, `PI_SKIP_VERSION_CHECK=1`, and `PI_TELEMETRY=0`. Do not inherit provider keys, proxy settings, `NODE_OPTIONS`, cloud credentials, or package-manager tokens. Pass the tarball and evidence directory as arguments.

Run the fixture from the installed client's package directory so the stdin module resolves its SDK and its own dependencies. Supply `run.ts` on standard input:

```sh
node --input-type=module - /bundle/linkbunny-pi-skill-0.1.0.tgz /evidence < /fixtures/run.ts
```

The loader reads the isolated global settings produced by `pi install`; it does not substitute a direct Skill path. Project trust, extensions, MCP, context, prompt templates, themes, retries, compaction, cache warming, tools, and model network refresh are disabled. Model credentials exist only in memory and are fake. Evidence includes CLI logs, the expanded public Skill context, the canned plan, and `acceptance.json`.
