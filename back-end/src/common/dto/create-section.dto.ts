import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSectionDto {
  @ApiProperty({ example: 'PC402-S1', description: 'Unique section identifier' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;

  @ApiProperty({ example: 'S1', description: 'Display name for the section' })
  @IsString()
  @IsNotEmpty()
  sectionName: string;

  @ApiProperty({ example: 'PC402', description: 'Associated course ID' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 'SPRING2026', description: 'Academic term ID' })
  @IsString()
  @IsNotEmpty()
  termId: string;
}
