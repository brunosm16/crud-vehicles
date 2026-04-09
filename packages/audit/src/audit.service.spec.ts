import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuditService, VehicleEvent } from './audit.service';
import { AuditLog } from './audit-log.entity';

const mockLog: AuditLog = {
  id: 'log-uuid-1',
  action: 'CREATED',
  entityType: 'vehicle',
  entityId: 'vehicle-uuid-1',
  before: null,
  after: JSON.stringify({ placa: 'ABC1D23', modelo: 'Corolla' }),
  timestamp: new Date(),
};

const mockRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
};

describe('AuditService', () => {
  let service: AuditService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        { provide: getRepositoryToken(AuditLog), useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  describe('handleVehicleEvent', () => {
    it('should persist a CREATED event', async () => {
      const event: VehicleEvent = {
        action: 'CREATED',
        entityId: 'vehicle-uuid-1',
        before: null,
        after: { placa: 'ABC1D23', modelo: 'Corolla' },
        timestamp: new Date().toISOString(),
      };

      mockRepository.create.mockReturnValue(mockLog);
      mockRepository.save.mockResolvedValue(mockLog);

      const result = await service.handleVehicleEvent(event);
      expect(result).toEqual(mockLog);
      expect(mockRepository.create).toHaveBeenCalledWith({
        action: 'CREATED',
        entityType: 'vehicle',
        entityId: 'vehicle-uuid-1',
        before: null,
        after: JSON.stringify({ placa: 'ABC1D23', modelo: 'Corolla' }),
      });
      expect(mockRepository.save).toHaveBeenCalledWith(mockLog);
    });

    it('should persist an UPDATED event with before and after', async () => {
      const event: VehicleEvent = {
        action: 'UPDATED',
        entityId: 'vehicle-uuid-1',
        before: { modelo: 'Corolla' },
        after: { modelo: 'Civic' },
        timestamp: new Date().toISOString(),
      };

      const log = {
        ...mockLog,
        action: 'UPDATED',
        before: JSON.stringify({ modelo: 'Corolla' }),
        after: JSON.stringify({ modelo: 'Civic' }),
      };
      mockRepository.create.mockReturnValue(log);
      mockRepository.save.mockResolvedValue(log);

      const result = await service.handleVehicleEvent(event);
      expect(result.action).toBe('UPDATED');
      expect(mockRepository.create).toHaveBeenCalledWith({
        action: 'UPDATED',
        entityType: 'vehicle',
        entityId: 'vehicle-uuid-1',
        before: JSON.stringify({ modelo: 'Corolla' }),
        after: JSON.stringify({ modelo: 'Civic' }),
      });
    });

    it('should persist a DELETED event', async () => {
      const event: VehicleEvent = {
        action: 'DELETED',
        entityId: 'vehicle-uuid-1',
        before: { placa: 'ABC1D23' },
        after: null,
        timestamp: new Date().toISOString(),
      };

      const log = {
        ...mockLog,
        action: 'DELETED',
        before: JSON.stringify({ placa: 'ABC1D23' }),
        after: null,
      };
      mockRepository.create.mockReturnValue(log);
      mockRepository.save.mockResolvedValue(log);

      const result = await service.handleVehicleEvent(event);
      expect(result.action).toBe('DELETED');
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETED',
          after: null,
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return audit logs ordered by timestamp DESC', async () => {
      mockRepository.find.mockResolvedValue([mockLog]);
      const result = await service.findAll();
      expect(result).toEqual([mockLog]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
      });
    });

    it('should return empty array when no logs', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
    });
  });
});
