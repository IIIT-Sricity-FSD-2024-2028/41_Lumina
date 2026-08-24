import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiHeader, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { EnrollmentPhasesService } from './enrollment-phases.service';
import { Roles } from '../common/decorators/roles.decorator';
import { CreateEnrollmentPhaseDto, UpdateEnrollmentPhaseDto } from '../common/dto';

@ApiTags('EnrollmentPhases')
@ApiHeader({ name: 'x-role', required: true, description: 'Role of the requesting user' })
@Controller('enrollment-phases')
export class EnrollmentPhasesController {
  constructor(private readonly phasesService: EnrollmentPhasesService) {}

  @Get()
  @Roles('Assistant_Dean_2', 'Dean', 'Student')
  @ApiOperation({ summary: 'Get all enrollment phases' })
  @ApiResponse({ status: 200, description: 'List of enrollment phases.' })
  findAll() {
    return this.phasesService.findAll();
  }

  @Post()
  @Roles('Assistant_Dean_2', 'Dean')
  @ApiOperation({ summary: 'Create a new enrollment phase' })
  @ApiBody({ type: CreateEnrollmentPhaseDto })
  @ApiResponse({ status: 201, description: 'Enrollment phase created.' })
  @ApiResponse({ status: 400, description: 'Validation error.' })
  create(@Body() dto: CreateEnrollmentPhaseDto) {
    return this.phasesService.create(dto);
  }

  @Put(':id')
  @Roles('Assistant_Dean_2', 'Dean')
  @ApiOperation({ summary: 'Update an enrollment phase' })
  @ApiParam({ name: 'id', description: 'Phase ID', type: Number })
  @ApiBody({ type: UpdateEnrollmentPhaseDto })
  @ApiResponse({ status: 200, description: 'Enrollment phase updated.' })
  @ApiResponse({ status: 404, description: 'Phase not found.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEnrollmentPhaseDto,
  ) {
    return this.phasesService.update(id, dto);
  }

  @Delete(':id')
  @Roles('Assistant_Dean_2', 'Dean')
  @ApiOperation({ summary: 'Delete an enrollment phase' })
  @ApiParam({ name: 'id', description: 'Phase ID', type: Number })
  @ApiResponse({ status: 200, description: 'Enrollment phase deleted.' })
  @ApiResponse({ status: 404, description: 'Phase not found.' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.phasesService.remove(id);
  }
}
