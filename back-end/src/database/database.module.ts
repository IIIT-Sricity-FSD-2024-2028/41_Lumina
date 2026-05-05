import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * DatabaseModule – Global In-Memory Data Store
 *
 * Registered as a @Global() module so that DatabaseService
 * is available across the entire application without
 * requiring explicit imports in every feature module.
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
