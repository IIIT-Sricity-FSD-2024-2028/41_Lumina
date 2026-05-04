import { Module } from '@nestjs/common';
import { OverridesController } from './overrides.controller';
import { OverridesService } from './overrides.service';

@Module({
  controllers: [OverridesController],
  providers: [OverridesService],
})
export class OverridesModule {}
