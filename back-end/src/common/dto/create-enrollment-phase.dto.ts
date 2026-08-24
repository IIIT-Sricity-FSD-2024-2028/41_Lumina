import { IsIn, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateEnrollmentPhaseDto {
  @ApiProperty({ example: 'Phase 1 - Final Year Priority', description: 'Phase Name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Final Year',
    description: 'Eligible student group (e.g. Final Year, 3rd Year, 2nd Year, 1st Year, Backlog Students, All Students)',
  })
  @IsString()
  @IsNotEmpty()
  eligibleGroups: string;

  @ApiProperty({ example: 'Aug 1 – Aug 5, 2026', description: 'Phase timeline display string' })
  @IsString()
  @IsNotEmpty()
  timeline: string;

  @ApiProperty({ example: 'Upcoming', enum: ['Upcoming', 'Active', 'Completed'], description: 'Phase status' })
  @IsString()
  @IsIn(['Upcoming', 'Active', 'Completed'])
  status: 'Upcoming' | 'Active' | 'Completed';
}
