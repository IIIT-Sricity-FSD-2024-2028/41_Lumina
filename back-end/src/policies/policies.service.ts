import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PolicySettings, PolicyChangeLog } from '../database/interfaces';
import { UpdatePolicyDto } from './dto/update-policy.dto';

@Injectable()
export class PoliciesService {
  constructor(private readonly db: DatabaseService) {}

  getSettings(): PolicySettings {
    return this.db.policySettings;
  }

  getLogs(): PolicyChangeLog[] {
    return this.db.policyChangeLogs;
  }

  updateSettings(dto: UpdatePolicyDto, userRole = 'Assistant_Dean_2'): { settings: PolicySettings; logs: PolicyChangeLog[] } {
    const current = this.db.policySettings;

    // Check if locked and trying to modify fields other than unlocking
    if (current.isLocked && dto.isLocked !== false && (dto.minCredits !== undefined || dto.maxCredits !== undefined || dto.enforcePrereq !== undefined)) {
      throw new BadRequestException('Policies are locked and cannot be modified. Unlock them first.');
    }

    const min = dto.minCredits !== undefined ? dto.minCredits : current.minCredits;
    const max = dto.maxCredits !== undefined ? dto.maxCredits : current.maxCredits;

    if (min > max) {
      throw new BadRequestException(`Minimum credits (${min}) cannot be greater than maximum credits (${max}).`);
    }

    const { logMessage, ...settingsUpdates } = dto;
    
    // Filter out undefined values to prevent overwriting existing settings
    for (const key of Object.keys(settingsUpdates)) {
      if ((settingsUpdates as any)[key] !== undefined) {
        (this.db.policySettings as any)[key] = (settingsUpdates as any)[key];
      }
    }

    // Auto-create log entry
    const maxId = this.db.policyChangeLogs.reduce((max, l) => Math.max(max, l.id), 0);
    const message = logMessage || (dto.isLocked ? 'Policies Locked' : dto.isLocked === false ? 'Policies Unlocked' : dto.status === 'Validated' ? 'Policies Validated' : 'Policy settings updated');

    this.db.policyChangeLogs.unshift({
      id: maxId + 1,
      message,
      by: userRole.replace(/_/g, ' '),
      createdAt: new Date().toISOString(),
    });

    return {
      settings: { ...this.db.policySettings },
      logs: this.db.policyChangeLogs,
    };
  }
}
