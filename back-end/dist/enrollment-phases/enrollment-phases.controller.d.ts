import { EnrollmentPhasesService } from './enrollment-phases.service';
export declare class EnrollmentPhasesController {
    private readonly phasesService;
    constructor(phasesService: EnrollmentPhasesService);
    findAll(): import("../database").EnrollmentPhase[];
    create(data: any): import("../database").EnrollmentPhase;
    update(id: string, data: any): import("../database").EnrollmentPhase;
    remove(id: string): {
        success: boolean;
    };
}
