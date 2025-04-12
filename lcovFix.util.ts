// Jest 25.x onwards emits coverage reports on a different source path
// https://stackoverflow.com/q/60323177
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { cwd } from 'node:process';

const file = 'coverage/lcov.info';

if (existsSync(file)) {
  try {
    const data = readFileSync(file, 'utf8');
    const result = data.replace(/SF:/g, `SF:${cwd()}/`);
    writeFileSync(file, result, 'utf8');
  } catch (err) {
    console.error(err); // eslint-disable-line no-console
  }
}
