import { DynamicModule, Module } from '@nestjs/common';
import { AUTO_SEED, SeedService } from './seed.service';

@Module({})
export class DatabaseModule {
  static register(autoSeed: boolean): DynamicModule {
    return {
      module: DatabaseModule,
      providers: [{ provide: AUTO_SEED, useValue: autoSeed }, SeedService],
      exports: [SeedService],
    };
  }
}
