import { config } from 'dotenv';

// Load environment variables, prioritizing .env over .env.default
config({ path: ['.env', '.env.default'], quiet: true });

export const testSystemTime = 1735718400000; // Jan 1, 2025 00:00:00 GMT
