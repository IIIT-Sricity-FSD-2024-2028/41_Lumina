import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for submitting an override request.
 */
export class CreateOverrideDto {
  @ApiProperty({ example: 'S2024001', description: 'Student institutional ID' })
  @IsString()
  @IsNotEmpty()
  Student_ID!: string;

  @ApiProperty({ example: 'CS440', description: 'Target course code' })
  @IsString()
  @IsNotEmpty()
  Course_ID!: string;

  @ApiProperty({ example: 'Capacity Override needed to graduate.', description: 'Justification for the override' })
  @IsString()
  @IsNotEmpty()
  Reason!: string;
}
