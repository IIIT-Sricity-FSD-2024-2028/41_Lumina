import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { EnrollmentPhasesService } from './enrollment-phases.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiHeader } from '@nestjs/swagger';

@ApiTags('EnrollmentPhases')
@ApiHeader({ name: 'x-role', required: true })
@Controller('enrollment-phases')
export class EnrollmentPhasesController {
  constructor(private readonly phasesService: EnrollmentPhasesService) {}

  @Get()
  @Roles('Assistant_Dean_2', 'Dean', 'Student')
  findAll() {
    return this.phasesService.findAll();
  }

  @Post()
  @Roles('Assistant_Dean_2', 'Dean')
  create(@Body() data: any) {
    return this.phasesService.create(data);
  }

  @Put(':id')
  @Roles('Assistant_Dean_2', 'Dean')
  update(@Param('id') id: string, @Body() data: any) {
    return this.phasesService.update(Number(id), data);
  }

  @Delete(':id')
  @Roles('Assistant_Dean_2', 'Dean')
  remove(@Param('id') id: string) {
    return this.phasesService.remove(Number(id));
  }
}
