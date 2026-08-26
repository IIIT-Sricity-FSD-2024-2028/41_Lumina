import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LogManagerService } from '../common/middleware/log-manager.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, LogManagerService],
})
export class AuthModule {}
