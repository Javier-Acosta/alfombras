import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const server = fileURLToPath(new URL('./server.mjs', import.meta.url));
function rpc(messages) {
  const child = spawnSync(process.execPath, [server], {
    input: messages.map(m => typeof m === 'string' ? m : JSON.stringify({jsonrpc:'2.0', ...m})).join('\n')+'\n',
    encoding:'utf8', timeout:10000,
    env:{...process.env, CONNECTOR_ENV_PATH:server+'.missing-env'},
  });
  assert.equal(child.status, 0, child.stderr);
  return child.stdout.trim().split('\n').map(line=>JSON.parse(line));
}
test('MCP initialize, notifications, tools and context work without credentials', () => {
  const out = rpc([
    {id:1,method:'initialize',params:{protocolVersion:'2025-03-26'}},
    {method:'notifications/initialized'},
    {id:2,method:'tools/list'},
    {id:3,method:'tools/call',params:{name:'alfombras_context'}},
  ]);
  assert.equal(out.length,3);
  assert.equal(out[0].result.serverInfo.name,'mcp-app-alfombras');
  assert.equal(out[1].result.tools.length,9);
  assert.ok(out[1].result.tools.every(t=>t.annotations.readOnlyHint && !('execute' in t)));
  assert.equal(JSON.parse(out[2].result.content[0].text).project,'alfombras');
});
test('Missing credentials return actionable errors without crashing the server',()=>{
  const [out] = rpc([{id:1,method:'tools/call',params:{name:'alfombras_list_collections'}}]);
  assert.equal(out.result.isError,true);
  assert.match(out.result.content[0].text,/--setup/);
});
test('Malformed JSON and unknown methods return protocol errors',()=>{
  const out=rpc(['{',{id:2,method:'unknown'}]);
  assert.equal(out[0].error.code,-32700);
  assert.equal(out[0].id,null);
  assert.equal(out[1].error.code,-32601);
});
test('Raw GET rejects external URLs before any authentication',()=>{
  const [out]=rpc([{id:1,method:'tools/call',params:{name:'alfombras_raw_get',arguments:{path:'https://example.com',authenticated:true}}}]);
  assert.equal(out.result.isError,true);
  assert.match(out.result.content[0].text,/path debe empezar/);
});
