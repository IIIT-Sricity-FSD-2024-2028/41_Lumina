import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignSectionDto {
  @ApiProperty({ example: 'PC402-S1', description: 'The section ID to assign' })
  @IsString()
  @IsNotEmpty()
  sectionId: string;
}

export class BatchSectionItemDto {
  @ApiProperty({ example: 1, description: 'Enrollment ID of the registration' })
  @IsNotEmpty()
  enrollmentId: number;

  @ApiProperty({ example: 'PC402-S1', description: 'Section ID to assign (null to unassign)' })
  sectionId: string | null;
}

export class BatchAssignSectionsDto {
  @ApiProperty({
    type: [BatchSectionItemDto],
    description: 'Array of enrollment-to-section assignments',
  })
  @IsNotEmpty()
  assignments: BatchSectionItemDto[];
}
