import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { VehiclesController } from './vehicles.controller';
import { VehiclesService } from './vehicles.service';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

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

const mockService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('VehiclesController', () => {
  let controller: VehiclesController;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: mockService }],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  describe('findAll', () => {
    it('should return array of vehicles', async () => {
      mockService.findAll.mockResolvedValue([mockVehicle]);
      const result = await controller.findAll();
      expect(result).toEqual([mockVehicle]);
      expect(mockService.findAll).toHaveBeenCalledTimes(1);
    });

    it('should return empty array when no vehicles', async () => {
      mockService.findAll.mockResolvedValue([]);
      const result = await controller.findAll();
      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return one vehicle', async () => {
      mockService.findOne.mockResolvedValue(mockVehicle);
      const result = await controller.findOne('uuid-1');
      expect(result).toEqual(mockVehicle);
      expect(mockService.findOne).toHaveBeenCalledWith('uuid-1');
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.findOne.mockRejectedValue(new NotFoundException());
      await expect(controller.findOne('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('create', () => {
    it('should return created vehicle', async () => {
      mockService.create.mockResolvedValue(mockVehicle);
      const result = await controller.create(mockDto);
      expect(result).toEqual(mockVehicle);
      expect(mockService.create).toHaveBeenCalledWith(mockDto);
    });

    it('should pass the full dto to service', async () => {
      mockService.create.mockResolvedValue(mockVehicle);
      await controller.create(mockDto);
      const calledWith = mockService.create.mock.calls[0][0];
      expect(calledWith.placa).toBe(mockDto.placa);
      expect(calledWith.chassi).toBe(mockDto.chassi);
      expect(calledWith.renavam).toBe(mockDto.renavam);
      expect(calledWith.modelo).toBe(mockDto.modelo);
      expect(calledWith.marca).toBe(mockDto.marca);
      expect(calledWith.ano).toBe(mockDto.ano);
    });
  });

  describe('update', () => {
    it('should return updated vehicle', async () => {
      const updated = { ...mockVehicle, modelo: 'Civic' };
      mockService.update.mockResolvedValue(updated);
      const result = await controller.update('uuid-1', { modelo: 'Civic' });
      expect(result.modelo).toBe('Civic');
      expect(mockService.update).toHaveBeenCalledWith('uuid-1', {
        modelo: 'Civic',
      });
    });

    it('should accept partial update dto', async () => {
      const partial: UpdateVehicleDto = { marca: 'Honda', ano: 2024 };
      mockService.update.mockResolvedValue({ ...mockVehicle, ...partial });
      const result = await controller.update('uuid-1', partial);
      expect(result.marca).toBe('Honda');
      expect(result.ano).toBe(2024);
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.update.mockRejectedValue(new NotFoundException());
      await expect(
        controller.update('non-existent', { modelo: 'Civic' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should call service remove', async () => {
      mockService.remove.mockResolvedValue(undefined);
      await controller.remove('uuid-1');
      expect(mockService.remove).toHaveBeenCalledWith('uuid-1');
    });

    it('should return void (undefined)', async () => {
      mockService.remove.mockResolvedValue(undefined);
      const result = await controller.remove('uuid-1');
      expect(result).toBeUndefined();
    });

    it('should propagate NotFoundException from service', async () => {
      mockService.remove.mockRejectedValue(new NotFoundException());
      await expect(controller.remove('non-existent')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
