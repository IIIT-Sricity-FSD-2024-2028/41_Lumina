import { IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for updating the approval status of an override request.
 */
export class UpdateOverrideStatusDto {
  @ApiProperty({ example: 'Approved', enum: ['Approved', 'Rejected'], description: 'New approval status' })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Approved', 'Rejected'], {
    message: 'Approval_Status must be either "Approved" or "Rejected".',
  })
  Approval_Status!: string;
}
