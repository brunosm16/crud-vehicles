import { Test, TestingModule } from '@nestjs/testing';
import { AuditController } from './audit.controller';
import { AuditService, VehicleEvent } from './audit.service';
import { AuditLog } from './audit-log.entity';

const mockLog: AuditLog = {
  id: 'log-uuid-1',
  action: 'CREATED',
  entityType: 'vehicle',
  entityId: 'vehicle-uuid-1',
  before: null,
  after: JSON.stringify({ placa: 'ABC1D23' }),
  timestamp: new Date(),
};

const mockService = {
  handleVehicleEvent: jest.fn(),
  findAll: jest.fn(),
};

describe('AuditController', () => {
  let controller: AuditController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [{ provide: AuditService, useValue: mockService }],
    }).compile();

    controller = module.get<AuditController>(AuditController);
  });

  describe('handleVehicleEvent', () => {
    it('should delegate to audit service', async () => {
      const event: VehicleEvent = {
        action: 'CREATED',
        entityId: 'vehicle-uuid-1',
        before: null,
        after: { placa: 'ABC1D23' },
        timestamp: new Date().toISOString(),
      };

      mockService.handleVehicleEvent.mockResolvedValue(mockLog);
      const result = await controller.handleVehicleEvent(event);
      expect(result).toEqual(mockLog);
      expect(mockService.handleVehicleEvent).toHaveBeenCalledWith(event);
    });
  });

  describe('findAll', () => {
    it('should return all audit logs', async () => {
      mockService.findAll.mockResolvedValue([mockLog]);
      const result = await controller.findAll();
      expect(result).toEqual([mockLog]);
    });

    it('should return empty array when no logs', async () => {
      mockService.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });
});
