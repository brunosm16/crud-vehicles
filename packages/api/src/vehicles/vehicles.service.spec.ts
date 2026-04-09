import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';

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
  getOne: jest.fn().mockResolvedValue(null),
};

const mockRepository = {
  find: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => createQueryBuilderMock),
};

describe('VehiclesService', () => {
  let service: VehiclesService;

  beforeEach(async () => {
    jest.clearAllMocks();
    createQueryBuilderMock.getOne.mockResolvedValue(null);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VehiclesService,
        {
          provide: getRepositoryToken(Vehicle),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<VehiclesService>(VehiclesService);
  });

  describe('findAll', () => {
    it('should return array of vehicles', async () => {
      mockRepository.find.mockResolvedValue([mockVehicle]);
      const result = await service.findAll();
      expect(result).toEqual([mockVehicle]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
      });
    });

    it('should return empty array when no vehicles', async () => {
      mockRepository.find.mockResolvedValue([]);
      const result = await service.findAll();
      expect(result).toEqual([]);
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
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        'v.placa = :placa OR v.chassi = :chassi OR v.renavam = :renavam',
        {
          placa: mockDto.placa,
          chassi: mockDto.chassi,
          renavam: mockDto.renavam,
        }
      );
      expect(createQueryBuilderMock.andWhere).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when placa already exists', async () => {
      createQueryBuilderMock.getOne.mockResolvedValue(mockVehicle);
      await expect(service.create(mockDto)).rejects.toThrow(ConflictException);
      await expect(service.create(mockDto)).rejects.toThrow(
        'Já existe um veículo com a mesma placa, chassi ou renavam'
      );
    });

    it('should throw ConflictException when chassi already exists', async () => {
      createQueryBuilderMock.getOne.mockResolvedValue({
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
      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'v.id != :excludeId',
        { excludeId: 'uuid-1' }
      );
    });

    it('should use existing values for fields not in dto', async () => {
      const existing = { ...mockVehicle };
      mockRepository.findOneBy.mockResolvedValue(existing);
      mockRepository.save.mockResolvedValue(existing);

      await service.update('uuid-1', { modelo: 'Civic' });
      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        'v.placa = :placa OR v.chassi = :chassi OR v.renavam = :renavam',
        {
          placa: existing.placa,
          chassi: existing.chassi,
          renavam: existing.renavam,
        }
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
      createQueryBuilderMock.getOne.mockResolvedValue({
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

    it('should throw NotFoundException when vehicle not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
    });
  });
});
