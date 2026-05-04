import { Module } from '@nestjs/common';
import { EnrollmentPhasesController } from './enrollment-phases.controller';
import { EnrollmentPhasesService } from './enrollment-phases.service';

@Module({
  controllers: [EnrollmentPhasesController],
  providers: [EnrollmentPhasesService]
})
export class EnrollmentPhasesModule {}
