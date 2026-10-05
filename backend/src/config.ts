import { resolve } from 'path';

// Works from both `src/` (ts-node / jest) and `dist/` (compiled): both are one level below backend/.
const projectRoot = resolve(__dirname, '..', '..');

export const config = {
  port: parseInt(process.env.PORT ?? '3000', 10),
  dbPath: process.env.DB_PATH ?? resolve(projectRoot, 'database', 'library.sqlite'),
  frontendDist: resolve(projectRoot, 'frontend', 'dist'),
  autoSeed: process.env.AUTO_SEED !== 'false',
};
