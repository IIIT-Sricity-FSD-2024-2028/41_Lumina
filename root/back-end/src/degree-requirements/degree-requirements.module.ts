import { Module } from '@nestjs/common';
import { DegreeRequirementsController } from './degree-requirements.controller';
import { DegreeRequirementsService } from './degree-requirements.service';

@Module({
  controllers: [DegreeRequirementsController],
  providers: [DegreeRequirementsService],
})
export class DegreeRequirementsModule {}
