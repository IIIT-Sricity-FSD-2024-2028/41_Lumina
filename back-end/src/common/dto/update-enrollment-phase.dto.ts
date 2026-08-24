import { PartialType } from '@nestjs/swagger';
import { CreateEnrollmentPhaseDto } from './create-enrollment-phase.dto';

export class UpdateEnrollmentPhaseDto extends PartialType(CreateEnrollmentPhaseDto) {}
