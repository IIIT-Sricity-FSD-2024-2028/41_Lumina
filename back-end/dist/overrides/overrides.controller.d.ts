import { OverridesService } from './overrides.service';
import { CreateOverrideDto } from '../common/dto/create-override.dto';
import { UpdateOverrideStatusDto } from '../common/dto/update-override-status.dto';
export declare class OverridesController {
    private readonly overridesService;
    constructor(overridesService: OverridesService);
    findAll(): import("../database/interfaces").OverrideRequest[];
    findByStudent(studentId: string): import("../database/interfaces").OverrideRequest[];
    create(dto: CreateOverrideDto): import("../database/interfaces").OverrideRequest;
    updateStatus(id: number, dto: UpdateOverrideStatusDto): import("../database/interfaces").OverrideRequest;
}
