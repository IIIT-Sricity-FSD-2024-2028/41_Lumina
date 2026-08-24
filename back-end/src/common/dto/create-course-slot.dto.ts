import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCourseSlotDto {
  @ApiProperty({ example: 'PC402-S1', description: 'Section ID' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: 'F2024001', description: 'Faculty User ID' })
  @IsString()
  @IsNotEmpty()
  facultyId: string;

  @ApiProperty({ example: 'G01', description: 'Assigned classroom / lab number' })
  @IsString()
  @IsNotEmpty()
  roomNumber: string;

  @ApiProperty({ example: 'Monday', description: 'Day of the week' })
  @IsString()
  @IsNotEmpty()
  dayOfWeek: string;

  @ApiProperty({ example: '08:45', description: 'Slot start time (HH:MM)' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '09:45', description: 'Slot end time (HH:MM)' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ example: 'Syllabus details', description: 'Optional syllabus or class notes' })
  @IsString()
  @IsOptional()
  syllabus?: string | null;
}
