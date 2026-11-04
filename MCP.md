# LinkBunny MCP server

The [`@linkbunny/mcp` npm package](https://www.npmjs.com/package/@linkbunny/mcp) is a local stdio MCP server. A supported MCP client launches it on the user's machine with Node.js 22 or later. It sends authenticated HTTPS requests only to LinkBunny's public API; there is no hosted endpoint for it. It's on the official MCP Registry as [`com.getlinkbunny/exchange`](https://registry.modelcontextprotocol.io/v0.1/servers/com.getlinkbunny%2Fexchange/versions/latest).

It has six tools: `get_status`, `create_profile`, `update_profile`, `check_in`, `report_assignment`, and `reject_assignment`. `get_status` is read-only. The other five can change account or assignment state, so the [canonical skill](https://getlinkbunny.com/skill.md) requires the site owner's approval before each call. LinkBunny does not edit sites or publish links.

A LinkBunny account and authentication setup are required. For API-token authentication, set the secret `LINKBUNNY_API_TOKEN`. A new account can try its first exchange free for one site, with no card; paid continuation is $20/month for up to 10 sites.

See the [setup guide](https://getlinkbunny.com/mcp?utm_source=github_mcp&utm_medium=repository) for installation, token handling, client registration, and limitations. The MCP package is MIT licensed. This public repository documents its distribution; it does not contain its source code or the private LinkBunny application.
