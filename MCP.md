# LinkBunny MCP package

The published [`@linkbunny/mcp@0.1.1` npm package](https://www.npmjs.com/package/@linkbunny/mcp) is a local stdio server. A supported MCP client launches it on the user's machine with Node.js 22 or later. It sends authenticated HTTPS requests only to LinkBunny's public API; there is no hosted MCP endpoint.

It offers five tools: `create_profile`, `update_profile`, `check_in`, `report_assignment`, and `reject_assignment`. Calls can change account or assignment state, so the [canonical skill](https://getlinkbunny.com/skill.md) requires specific owner approval before each action. LinkBunny does not edit sites or publish links. An account, eligible paid subscription, and private API token are required for entitled operations.

See the [setup guide](https://getlinkbunny.com/docs/agents?utm_source=github_mcp&utm_medium=repository#mcp) for installation, token handling, client registration, and limitations. The MCP package is MIT licensed. This public repository documents its distribution; it does not contain its source code or the private LinkBunny application.
