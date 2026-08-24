import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementDto {
  @ApiProperty({ example: 'PC402', description: 'Course ID for the announcement' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ example: 'Midterm Schedule Announcement', description: 'Announcement title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Midterm will be conducted on Wednesday.', description: 'Announcement body' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
