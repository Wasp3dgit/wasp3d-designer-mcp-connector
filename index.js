// stdio-to-HTTP bridge: Claude Desktop speaks JSON-RPC over stdin/stdout;
// this script forwards each line to WASP3D Designer's local MCP HttpListener.

const http = require('http');
const fs   = require('fs');
const os   = require('os');
const path = require('path');

const LOG_FILE = path.join(os.tmpdir(), 'wasp3d-mcp-bridge.log');

function log(msg) {
  try {
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()}  ${msg}\n`);
  } catch (_) {}
}

// WASP3D Designer stores its MCP port in the .exe.config — read it so the
// bridge stays in sync when the user changes the port in Designer settings.
function readDesignerPort() {
  try {
    const config = fs.readFileSync(
      'C:\\Program Files\\Beehive Systems Ltd\\WASP3D\\Designer\\Bin\\Wasp3D Designer.exe.config',
      'utf8'
    );
    const match = config.match(/<add key="Wasp3D\.Designer\.MCP\.Port"\s+value="(\d+)"/);
    if (match) return match[1];
  } catch (_) {
    log('Could not read Designer config — using default port 8765');
  }
  return '8765';
}

// WASP3D_MCP_URL env var allows overriding the target (e.g. non-default install path).
const MCP_URL = process.env.WASP3D_MCP_URL || `http://localhost:${readDesignerPort()}/mcp`;

log(`Bridge started — forwarding to ${MCP_URL}`);
log(`Log file: ${LOG_FILE}`);

process.stdin.setEncoding('utf8');
let buffer = '';

process.stdin.on('data', (chunk) => {
  buffer += chunk;
  const lines = buffer.split('\n');
  buffer = lines.pop();
  for (const line of lines) {
    if (line.trim()) forward(line.trim());
  }
});

function forward(jsonLine) {
  let method = '?';
  try { method = JSON.parse(jsonLine).method ?? '?'; } catch (_) {}
  log(`→ ${method}`);

  const url = new URL(MCP_URL);
  const options = {
    hostname: url.hostname,
    port: parseInt(url.port, 10),
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(jsonLine),
    },
  };

  const req = http.request(options, (res) => {
    if (res.statusCode === 204) { res.resume(); log(`← 204 No Content`); return; }
    let body = '';
    res.on('data', (c) => { body += c; });
    res.on('end', () => {
      log(`← ${res.statusCode} (${Buffer.byteLength(body)} bytes)`);
      if (method === 'prompts/get' || method === 'prompts/list') log(`PROMPT RESPONSE: ${body}`);
      if (body.trim()) process.stdout.write(body.trim() + '\n');
    });
  });

  req.on('error', (err) => {
    const id = extractId(jsonLine);
    const isRefused = err.code === 'ECONNREFUSED';
    log(`ERROR: ${err.message}`);
    process.stdout.write(JSON.stringify({
      jsonrpc: '2.0',
      id,
      error: {
        code: isRefused ? -32000 : -32603,
        message: isRefused
          ? 'WASP3D Designer is not running. Launch Designer first.'
          : `Bridge error: ${err.message}`,
      },
    }) + '\n');
  });

  req.write(jsonLine);
  req.end();
}

function extractId(line) {
  try { return JSON.parse(line).id ?? null; } catch { return null; }
}
