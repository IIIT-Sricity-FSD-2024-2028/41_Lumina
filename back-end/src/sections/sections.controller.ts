import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { SectionsService } from './sections.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateSectionDto, UpdateSectionDto } from '../common/dto';

@ApiTags('Sections')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('sections')
export class SectionsController {
  constructor(private readonly sectionsService: SectionsService) {}

  @Get()
  @Roles('Assistant_Dean_1', 'Dean', 'Faculty', 'Student', 'Assistant_Dean_2')
  @ApiOperation({ summary: 'Get all sections' })
  @ApiResponse({ status: 200, description: 'List of all sections.' })
  findAll() {
    return this.sectionsService.findAll();
  }

  @Post()
  @Roles('Assistant_Dean_1', 'Dean')
  @ApiOperation({ summary: 'Create a new course section' })
  @ApiBody({ type: CreateSectionDto })
  @ApiResponse({ status: 201, description: 'Section created successfully.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(@Body() dto: CreateSectionDto) {
    return this.sectionsService.create(dto);
  }

  @Put(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  @ApiOperation({ summary: 'Update a section' })
  @ApiParam({ name: 'id', description: 'Section ID', example: 'PC402-S1' })
  @ApiBody({ type: UpdateSectionDto })
  @ApiResponse({ status: 200, description: 'Section updated successfully.' })
  @ApiResponse({ status: 404, description: 'Section not found.' })
  update(@Param('id') id: string, @Body() dto: UpdateSectionDto) {
    return this.sectionsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Assistant_Dean_1', 'Dean')
  @ApiOperation({ summary: 'Delete a section' })
  @ApiParam({ name: 'id', description: 'Section ID', example: 'PC402-S1' })
  @ApiResponse({ status: 200, description: 'Section deleted.' })
  remove(@Param('id') id: string) {
    return this.sectionsService.remove(id);
  }
}
