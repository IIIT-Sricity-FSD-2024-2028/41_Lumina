import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { SectionsService } from './sections.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiHeader } from '@nestjs/swagger';

@ApiTags('Sections')
@ApiHeader({ name: 'x-role', required: true })
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @Roles('Assistant_Dean_1', 'Dean', 'Faculty', 'Student', 'Assistant_Dean_2')
  findAll() {
    return this.sectionsService.findAll();
  }

  @Post()
  @Roles('Assistant_Dean_1', 'Dean')
  create(@Body() data: any) {
    return this.sectionsService.create(data);
  }

  @Put(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  update(@Param('id') id: string, @Body() data: any) {
    return this.sectionsService.update(id, data);
  }

  @Delete(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }
}
