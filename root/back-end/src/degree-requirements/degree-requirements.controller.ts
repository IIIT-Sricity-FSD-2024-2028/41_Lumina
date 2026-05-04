import { Controller, Get } from '@nestjs/common';
import { DegreeRequirementsService } from './degree-requirements.service';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiTags, ApiHeader } from '@nestjs/swagger';

@ApiTags('Degree Requirements')
@ApiHeader({ name: 'x-role', required: true })
@Controller('degree-requirements')
export class DegreeRequirementsController {
  constructor(private readonly drService: DegreeRequirementsService) {}

  @Get()
  @Roles('Assistant_Dean_1', 'Dean', 'Faculty', 'Student', 'Assistant_Dean_2')
  findAll() {
    return this.drService.findAll();
  }
}
