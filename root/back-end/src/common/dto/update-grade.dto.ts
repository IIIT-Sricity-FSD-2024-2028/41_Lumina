import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateGradeDto {
  @ApiProperty({ example: 'A', description: 'Final Grade' })
  @IsString()
  @IsNotEmpty()
  finalGrade!: string;
}
