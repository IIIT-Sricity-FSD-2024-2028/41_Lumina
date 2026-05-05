import { DegreeRequirementsService } from './degree-requirements.service';
export declare class DegreeRequirementsController {
    private readonly drService;
    constructor(drService: DegreeRequirementsService);
    findAll(): import("../database").DegreeRequirement[];
}
