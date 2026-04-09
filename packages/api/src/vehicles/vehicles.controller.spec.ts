import { Test, TestingModule } from '@nestjs/testing';
import { VehiclesController } from './vehicles.controller';
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

const mockService = {
  findAll: jest.fn().mockResolvedValue([mockVehicle]),
  findOne: jest.fn().mockResolvedValue(mockVehicle),
  create: jest.fn().mockResolvedValue(mockVehicle),
  update: jest.fn().mockResolvedValue({ ...mockVehicle, modelo: 'Civic' }),
  remove: jest.fn().mockResolvedValue(undefined),
};

describe('VehiclesController', () => {
  let controller: VehiclesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [VehiclesController],
      providers: [{ provide: VehiclesService, useValue: mockService }],
    }).compile();

    controller = module.get<VehiclesController>(VehiclesController);
  });

  it('findAll should return array of vehicles', async () => {
    const result = await controller.findAll();
    expect(result).toEqual([mockVehicle]);
  });

  it('findOne should return one vehicle', async () => {
    const result = await controller.findOne('uuid-1');
    expect(result).toEqual(mockVehicle);
    expect(mockService.findOne).toHaveBeenCalledWith('uuid-1');
  });

  it('create should return created vehicle', async () => {
    const result = await controller.create(mockDto);
    expect(result).toEqual(mockVehicle);
    expect(mockService.create).toHaveBeenCalledWith(mockDto);
  });

  it('update should return updated vehicle', async () => {
    const result = await controller.update('uuid-1', { modelo: 'Civic' });
    expect(result.modelo).toBe('Civic');
  });

  it('remove should call service remove', async () => {
    await controller.remove('uuid-1');
    expect(mockService.remove).toHaveBeenCalledWith('uuid-1');
  });
});
