import { IsBoolean, IsNumber, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePolicyDto {
  @ApiPropertyOptional({ example: 'Validated', enum: ['Validated', 'Pending'] })
  @IsString()
  @IsOptional()
  @IsIn(['Validated', 'Pending'])
  status?: 'Validated' | 'Pending';

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @ApiPropertyOptional({ example: 12 })
  @IsNumber()
  @IsOptional()
  minCredits?: number;

  @ApiPropertyOptional({ example: 22 })
  @IsNumber()
  @IsOptional()
  maxCredits?: number;

  @ApiPropertyOptional({ example: 6 })
  @IsNumber()
  @IsOptional()
  maxCourses?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  enforcePrereq?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  allowConditional?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  allowAdvisorOverride?: boolean;

  @ApiPropertyOptional({ example: 5.0 })
  @IsNumber()
  @IsOptional()
  minGpa?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  financialClearance?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  advisorApproval?: boolean;

  @ApiPropertyOptional({ example: '2025-2026' })
  @IsString()
  @IsOptional()
  academicYear?: string;

  @ApiPropertyOptional({ example: 'Spring' })
  @IsString()
  @IsOptional()
  term?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  termLocked?: boolean;

  @ApiPropertyOptional({ example: 'Active', enum: ['Active', 'Deactivated'] })
  @IsString()
  @IsOptional()
  @IsIn(['Active', 'Deactivated'])
  systemStatus?: 'Active' | 'Deactivated';

  @ApiPropertyOptional({ example: 'Open', enum: ['Open', 'Paused', 'Closed'] })
  @IsString()
  @IsOptional()
  @IsIn(['Open', 'Paused', 'Closed'])
  windowStatus?: 'Open' | 'Paused' | 'Closed';

  @ApiPropertyOptional({ example: '2026-08-01T09:00' })
  @IsString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-08-30T17:00' })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 'Updated min credits to 12', description: 'Log message describing this policy change' })
  @IsString()
  @IsOptional()
  logMessage?: string;
}
