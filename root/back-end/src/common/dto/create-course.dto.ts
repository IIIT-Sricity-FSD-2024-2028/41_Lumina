import { IsNotEmpty, IsString, IsNumber, IsIn, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CourseStatus } from '../../database/interfaces';

export class CreateCourseDto {
  @ApiProperty({ example: 'CS101', description: 'Course ID' })
  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @ApiProperty({ example: 'Introduction to Programming', description: 'Course Name' })
  @IsString()
  @IsNotEmpty()
  courseName!: string;

  @ApiProperty({ example: 4, description: 'Credits' })
  @IsNumber()
  @IsNotEmpty()
  credits!: number;

  @ApiProperty({ example: 60, description: 'Course Capacity' })
  @IsNumber()
  @IsNotEmpty()
  courseCapacity!: number;

  @ApiProperty({ example: 'Active', enum: ['Active', 'Inactive'] })
  @IsString()
  @IsIn(['Active', 'Inactive'])
  status!: CourseStatus;

  @ApiProperty({ example: 'CSE', description: 'Department ID' })
  @IsString()
  @IsNotEmpty()
  deptId!: string;

  @ApiPropertyOptional({ example: 'UG2', description: 'UG Year (UG1-UG4)' })
  @IsString()
  @IsOptional()
  ugYear?: string;

  @ApiPropertyOptional({ example: 'Spring', description: 'Semester (Monsoon or Spring)' })
  @IsString()
  @IsOptional()
  semester?: string;

  @ApiPropertyOptional({ example: 'Program Core', description: 'Course type for degree requirements' })
  @IsString()
  @IsOptional()
  courseType?: string;

  @ApiPropertyOptional({ example: ['CS101'], description: 'Prerequisite course IDs' })
  @IsArray()
  @IsOptional()
  prerequisites?: string[];
}
