import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for enrolling a student in a course.
 */
export class EnrollCourseDto {
  @ApiProperty({ example: 'S2024001', description: 'Student institutional ID' })
  @IsString()
  @IsNotEmpty()
  Student_ID!: string;

  @ApiProperty({ example: 'CS301', description: 'Course code to enroll in' })
  @IsString()
  @IsNotEmpty()
  Course_ID!: string;
}
