import { IsNotEmpty, IsString, IsNumber, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
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
}
