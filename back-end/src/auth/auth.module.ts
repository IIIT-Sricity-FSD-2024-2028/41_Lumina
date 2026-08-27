import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LogManagerService } from '../common/middleware/log-manager.service';

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'lumina_super_secure_jwt_secret_key_2026_academic_platform',
      signOptions: { expiresIn: (process.env.JWT_EXPIRATION as any) || '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, LogManagerService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}

