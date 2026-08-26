import { Module } from '@nestjs/common';
import { SuperUserController } from './super-user.controller';
import { SuperUserService } from './super-user.service';
import { DatabaseModule } from '../database/database.module';
import { LogManagerService } from '../common/middleware/log-manager.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SuperUserController],
  providers: [SuperUserService, LogManagerService],
  exports: [SuperUserService],
})
export class SuperUserModule {}
