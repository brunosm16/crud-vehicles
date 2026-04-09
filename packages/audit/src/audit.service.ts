import { Injectable } from '@nestjs/common';
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
    private readonly auditRepository: Repository<AuditLog>
  ) {}

  async handleVehicleEvent(event: VehicleEvent): Promise<AuditLog> {
    console.log('Received vehicle event:', event);

    const log = this.auditRepository.create({
      action: event.action,
      entityType: 'vehicle',
      entityId: event.entityId,
      before: event.before ? JSON.stringify(event.before) : null,
      after: event.after ? JSON.stringify(event.after) : null,
    });
    return this.auditRepository.save(log);
  }

  async findAll(): Promise<AuditLog[]> {
    return this.auditRepository.find({ order: { timestamp: 'DESC' } });
  }
}
