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
  });

  describe('findOne', () => {
    it('should return a vehicle by id', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockVehicle);
      const result = await service.findOne('uuid-1');
      expect(result).toEqual(mockVehicle);
    });

    it('should throw NotFoundException when not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException
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

    it('should throw ConflictException when placa/chassi/renavam already exists', async () => {
      createQueryBuilderMock.getOne.mockResolvedValue(mockVehicle);
      await expect(service.create(mockDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update and return the vehicle', async () => {
      mockRepository.findOneBy.mockResolvedValue({ ...mockVehicle });
      const updated = { ...mockVehicle, modelo: 'Civic' };
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update('uuid-1', { modelo: 'Civic' });
      expect(result.modelo).toBe('Civic');
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(
        service.update('non-existent', { modelo: 'Civic' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a vehicle', async () => {
      mockRepository.findOneBy.mockResolvedValue(mockVehicle);
      mockRepository.delete.mockResolvedValue({ affected: 1 });

      await service.remove('uuid-1');
      expect(mockRepository.delete).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw NotFoundException when vehicle not found', async () => {
      mockRepository.findOneBy.mockResolvedValue(null);
      await expect(service.remove('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
