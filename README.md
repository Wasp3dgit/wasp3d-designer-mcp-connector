# WASP3D Designer — Claude Desktop Extension

Control **WASP3D Designer** broadcast graphics with natural language via Claude Desktop. Create and animate scene objects, manage templates, set variables, and drive data-bound live TV graphics — all from a prompt.

---

## Prerequisites

- [WASP3D Drone Designer]
- [Claude Desktop](https://claude.ai/download) Windows

---

## Installation

### From Anthropic's Directory *(coming soon)*
Once listed, click **Install** directly from within Claude Desktop — no file download needed.

### Manual Install
1. Download `wasp3d-mcpb.mcpb` from the [Releases](https://github.com/Wasp3dgit/wasp3d-designer-mcp-connector/releases) page
2. Open Claude Desktop → **Settings → Extensions → Install Extension**
3. Select the `.mcpb` file
4. Launch WASP3D Designer before starting a conversation

No additional software required — Claude Desktop ships its own Node.js runtime.

---

## Example Prompts

```
Create a BBC-style lower-third name band for "JOHN SMITH", title "Senior Correspondent"
```

```
Build a 2-team scoreboard for IND vs AUS with scores 0 and 0
```

```
Set the variable BG_Color to red and animate the NameBand template in
```

---

## How It Works

```
Claude Desktop  →  stdio  →  index.js (bridge)  →  HTTP  →  WASP3D Designer (local MCP server)
```

`index.js` is a lightweight stdio-to-HTTP bridge. All MCP logic — 142 tools covering scene objects, materials, templates, variables, animations, and render order — runs inside WASP3D Designer itself.

---

## Configuration

The MCP server port can be changed in WASP3D Designer's configuration file:

```
C:\Program Files\Beehive Systems Ltd\WASP3D\Designer\Bin\Wasp3D Designer.exe.config
```

The bridge reads this file automatically on startup and connects to the configured port.

For advanced use (e.g. a non-standard install path where the config file cannot be found), you can override the target URL via an environment variable:

```
WASP3D_MCP_URL=http://localhost:<port>/mcp
```

---

## License

MIT
