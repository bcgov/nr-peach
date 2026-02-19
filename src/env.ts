import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';

import type { PathLike } from 'node:fs';

// Load environment variables, prioritizing .env over .env.default
const envFiles: readonly PathLike[] = ['./.env', './.env.default'];
envFiles.forEach((envFile) => (existsSync(envFile) ? loadEnvFile(envFile) : null));
