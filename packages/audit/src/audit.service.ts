import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface VehicleEvent {
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {}

  async handleVehicleEvent(event: VehicleEvent): Promise<AuditLog> {
    this.logger.log(
      `Received ${event.action} event for vehicle ${event.entityId}`,
      'AuditService'
    );

    const log = this.auditRepository.create({
      action: event.action,
      entityType: 'vehicle',
      entityId: event.entityId,
      before: event.before ? JSON.stringify(event.before) : null,
      after: event.after ? JSON.stringify(event.after) : null,
    });
    const saved = await this.auditRepository.save(log);

    this.logger.log(
      `Persisted audit log ${saved.id} for ${event.action} on vehicle ${event.entityId}`,
      'AuditService'
    );

    return saved;
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditRepository.find({ order: { timestamp: 'DESC' } });
  }
}
