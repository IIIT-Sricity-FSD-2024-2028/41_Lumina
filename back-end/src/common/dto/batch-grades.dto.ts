import { IsNotEmpty, IsNumber, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class GradeSubmissionItemDto {
  @ApiProperty({ example: 180, description: 'Enrollment ID' })
  @IsNumber()
  @IsNotEmpty()
  enrollmentId: number;

  @ApiProperty({ example: 'A', description: 'Final Grade (e.g. S, A, B, C, D, F)' })
  @IsString()
  @IsNotEmpty()
  finalGrade: string;
}

export class BatchSubmitGradesDto {
  @ApiProperty({
    type: [GradeSubmissionItemDto],
    description: 'Array of student grades to update',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GradeSubmissionItemDto)
  grades: GradeSubmissionItemDto[];
}
