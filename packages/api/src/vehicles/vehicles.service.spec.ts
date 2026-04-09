import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { Not } from 'typeorm';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

const mockVehicle: Vehicle = {
  id: 'uuid-1',
  placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251',
  renavam: '12345678901',
  modelo: 'Corolla',
  marca: 'Toyota',
  ano: 2022,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockDto: CreateVehicleDto = {
  placa: 'ABC1D23',
  chassi: '9BWZZZ377VT004251',
  renavam: '12345678901',
  modelo: 'Corolla',
  marca: 'Toyota',
  ano: 2022,
};

const createQueryBuilderMock = {
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getOne: jest.fn().mockResolvedValue(null),
  getMany: jest.fn().mockResolvedValue([]),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
};

const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  findAndCount: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => createQueryBuilderMock),
};

const mockKafkaProducer = {
  emitVehicleEvent: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
};

describe('VehiclesService', () => {
  let service: VehiclesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.findOne.mockResolvedValue(null);
    createQueryBuilderMock.getOne.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockRepository,
        },
        {
          provide: KafkaProducerService,
          useValue: mockKafkaProducer,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('findAll', () => {
    it('should return paginated vehicles', async () => {
      createQueryBuilderMock.getManyAndCount.mockResolvedValue([
        [mockVehicle],
        1,
      ]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual([mockVehicle]);
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      expect(createQueryBuilderMock.orderBy).toHaveBeenCalledWith(
        'v.createdAt',
        'DESC'
      );
      expect(createQueryBuilderMock.addOrderBy).toHaveBeenCalledWith(
        'v.rowid',
        'DESC'
      );
      expect(createQueryBuilderMock.skip).toHaveBeenCalledWith(0);
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(10);
    });

    it('should return empty data when no vehicles', async () => {
      createQueryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
      expect(result.meta.totalPages).toBe(0);
    });

    it('should apply filters', async () => {
      createQueryBuilderMock.getManyAndCount.mockResolvedValue([
        [mockVehicle],
        1,
      ]);
      await service.findAll({ page: 1, limit: 10, marca: 'Toyota', ano: 2022 });
      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'v.marca LIKE :marca',
        { marca: '%Toyota%' }
      );
      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'v.ano = :ano',
        { ano: 2022 }
      );
    });

    it('should calculate correct skip for page > 1', async () => {
      createQueryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);
      await service.findAll({ page: 3, limit: 5 });
      expect(createQueryBuilderMock.skip).toHaveBeenCalledWith(10);
      expect(createQueryBuilderMock.take).toHaveBeenCalledWith(5);
    });
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockVehicle);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockVehicle);
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });

    it('should include id in NotFoundException message', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('abc-123')).rejects.toThrow(
        'Veículo com id "abc-123" não encontrado'
      );
    });
  });

  describe('create', () => {
    it('should create and return a vehicle', async () => {
      mockRepository.create.mockReturnValue(mockVehicle);
      mockRepository.save.mockResolvedValue(mockVehicle);

      const result = await service.create(mockDto);
      expect(result).toEqual(mockVehicle);
      expect(mockRepository.create).toHaveBeenCalledWith(mockDto);
      expect(mockRepository.save).toHaveBeenCalledWith(mockVehicle);
    });

    it('should call ensureUnique before creating', async () => {
      mockRepository.create.mockReturnValue(mockVehicle);
      mockRepository.save.mockResolvedValue(mockVehicle);

      await service.create(mockDto);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [
          { placa: mockDto.placa },
          { chassi: mockDto.chassi },
          { renavam: mockDto.renavam },
        ],
      });
    });

    it('should emit CREATED event via Kafka', async () => {
      mockRepository.create.mockReturnValue(mockVehicle);
      mockRepository.save.mockResolvedValue(mockVehicle);

      await service.create(mockDto);
      expect(mockKafkaProducer.emitVehicleEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CREATED',
          entityId: mockVehicle.id,
          before: null,
          after: expect.objectContaining({ placa: mockDto.placa }),
        })
      );
    });

    it('should throw ConflictException when placa already exists', async () => {
      mockRepository.findOne.mockResolvedValue(mockVehicle);
      await expect(service.create(mockDto)).rejects.toThrow(ConflictException);
      await expect(service.create(mockDto)).rejects.toThrow(
        'Já existe um veículo com a mesma placa, chassi ou renavam'
      );
    });

    it('should throw ConflictException when chassi already exists', async () => {
      mockRepository.findOne.mockResolvedValue({
        ...mockVehicle,
        placa: 'XYZ9999',
      });
      await expect(service.create(mockDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update and return the vehicle', async () => {
      const existing = { ...mockVehicle };
      mockRepository.findOneBy.mockResolvedValue(existing);
      const updated = { ...mockVehicle, modelo: 'Civic' };
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { modelo: 'Civic' });
      expect(result.modelo).toBe('Civic');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should call ensureUnique with excludeId on update', async () => {
      const existing = { ...mockVehicle };
      mockRepository.findOneBy.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(existing);

      await service.update('uuid-1', { modelo: 'Civic' });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: [
          { id: Not('uuid-1'), placa: existing.placa },
          { id: Not('uuid-1'), chassi: existing.chassi },
          { id: Not('uuid-1'), renavam: existing.renavam },
        ],
      });
    });

    it('should use existing values for fields not in dto', async () => {
      const existing = { ...mockVehicle };
      mockRepository.findOneBy.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(existing);

      await service.update('uuid-1', { modelo: 'Civic' });
      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.arrayContaining([
            expect.objectContaining({ placa: existing.placa }),
            expect.objectContaining({ chassi: existing.chassi }),
            expect.objectContaining({ renavam: existing.renavam }),
          ]),
        })
      );
    });

    it('should emit UPDATED event via Kafka', async () => {
      const existing = { ...mockVehicle };
      mockRepository.findOneBy.mockResolvedValue(existing);
      mockRepository.save.mockImplementation((v) => Promise.resolve(v));

      await service.update('uuid-1', { modelo: 'Civic' });
      expect(mockKafkaProducer.emitVehicleEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'UPDATED',
          entityId: 'uuid-1',
          before: expect.objectContaining({ modelo: 'Corolla' }),
          after: expect.objectContaining({ modelo: 'Civic' }),
        })
      );
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { modelo: 'Civic' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when updating to conflicting data', async () => {
      const existing = { ...mockVehicle };
      mockRepository.findOneBy.mockResolvedValue(existing);
      mockRepository.findOne.mockResolvedValue({
        ...mockVehicle,
        id: 'uuid-2',
      });

      await expect(
        service.update('uuid-1', { placa: 'CONFLICT' })
      ).rejects.toThrow(ConflictException);
    });

    it('should merge dto into existing entity', async () => {
      const existing = { ...mockVehicle };
      mockRepository.findOneBy.mockResolvedValue(existing);
      mockRepository.save.mockImplementation((v) => Promise.resolve(v));

      const result = await service.update('uuid-1', {
        modelo: 'Civic',
        marca: 'Honda',
      });
      expect(result.modelo).toBe('Civic');
      expect(result.marca).toBe('Honda');
      expect(result.placa).toBe(mockVehicle.placa);
    });
  });

  describe('remove', () => {
    it('should delete a vehicle', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockVehicle);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('uuid-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('should call findOne before deleting', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockVehicle);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('uuid-1');
      expect(mockRepository.findOneBy).toHaveBeenCalledWith({ id: 'uuid-1' });
    });

    it('should emit DELETED event via Kafka', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockVehicle);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('uuid-1');
      expect(mockKafkaProducer.emitVehicleEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'DELETED',
          entityId: 'uuid-1',
          before: expect.objectContaining({ placa: mockVehicle.placa }),
          after: null,
        })
      );
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
