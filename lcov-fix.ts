// Jest 25.x onwards emits coverage reports on a different source path
// https://stackoverflow.com/q/60323177
import { readFile, writeFile } from 'node:fs';
import { cwd } from 'node:process';

const file = './coverage/lcov.info';

readFile(file, 'utf8', (err, data) => {
  if (err) {
    return console.error(err); // eslint-disable-line no-console
  }
  const result = data.replace(/SF:/g, `SF:${cwd()}/`);

  writeFile(file, result, 'utf8', (err) => {
    if (err) return console.error(err); // eslint-disable-line no-console
  });
});
