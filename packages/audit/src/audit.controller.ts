import { Controller, Get } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuditService, VehicleEvent } from './audit.service';

@Controller()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @MessagePattern('vehicles.events')
  async handleVehicleEvent(@Payload() event: VehicleEvent) {
    return this.auditService.handleVehicleEvent(event);
  }

  @Get('audit/logs')
  findAll() {
    return this.auditService.findAll();
  }
}
