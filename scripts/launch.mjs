import { spawn } from 'node:child_process';
import { openSync, closeSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const url = 'http://127.0.0.1:8770/';
async function ready() {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    return response.ok && (await response.text()).includes('Nashua Table');
  } catch { return false; }
}

try {
  if (!(await ready())) {
    const out = openSync(path.join(root, 'server.log'), 'a');
    const err = openSync(path.join(root, 'server-error.log'), 'a');
    const child = spawn(process.execPath, [path.join(root, 'scripts', 'serve.mjs')], {
      cwd: root, detached: true, windowsHide: true,
      env: { ...process.env, NASHUA_PORT: '8770' }, stdio: ['ignore', out, err],
    });
    await new Promise((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    child.unref();
    closeSync(out);
    closeSync(err);
    for (let attempt = 0; attempt < 30 && !(await ready()); attempt++) {
      await new Promise(resolve => setTimeout(resolve, 250));
    }
  }
  if (!(await ready())) throw new Error('Could not start Nashua Table. Check server-error.log in the project folder.');
  console.log(`Nashua Table is running at ${url}`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
