import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from './seed.service';

async function run() {
  const app = await NestFactory.createApplicationContext(
    AppModule.register({ serveFrontend: false, autoSeed: false }),
    { logger: ['log', 'warn', 'error'] },
  );
  await app.get(SeedService).seed({ reset: true });
  await app.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
