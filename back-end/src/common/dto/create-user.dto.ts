import { IsEmail, IsNotEmpty, IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a new user in the system.
 */
export class CreateUserDto {
  @ApiProperty({ example: 'S2025001', description: 'Unique institutional ID' })
  @IsString()
  @IsNotEmpty()
  User_ID!: string;

  @ApiProperty({ example: 'Jane Doe', description: 'Full legal name' })
  @IsString()
  @IsNotEmpty()
  Full_Name!: string;

  @ApiProperty({ example: 'jane@lumina.iiits.in', description: 'Institutional email' })
  @IsEmail()
  @IsNotEmpty()
  Email!: string;

  @ApiProperty({ example: 'password123', description: 'Account password' })
  @IsString()
  @IsNotEmpty()
  Password!: string;

  @ApiProperty({ example: 'Student', enum: ['Student', 'Faculty', 'Assistant_Dean_1', 'Assistant_Dean_2', 'Dean'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Student', 'Faculty', 'Assistant_Dean_1', 'Assistant_Dean_2', 'Dean'])
  Role!: string;

  @ApiProperty({ example: 'CSE', description: 'Department code' })
  @IsString()
  @IsNotEmpty()
  Dept_ID!: string;
}
