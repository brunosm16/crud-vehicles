import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepo: Repository<Vehicle>
  ) {}

  findAll(): Promise<Vehicle[]> {
    return this.vehiclesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepo.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException(`Veículo com id "${id}" não encontrado`);
    }
    return vehicle;
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    await this.ensureUnique(dto.placa, dto.chassi, dto.renavam);
    const vehicle = this.vehiclesRepo.create(dto);
    return this.vehiclesRepo.save(vehicle);
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const existing = await this.findOne(id);
    await this.ensureUnique(
      dto.placa ?? existing.placa,
      dto.chassi ?? existing.chassi,
      dto.renavam ?? existing.renavam,
      id
    );
    Object.assign(existing, dto);
    return this.vehiclesRepo.save(existing);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.vehiclesRepo.delete(id);
  }

  private async ensureUnique(
    placa: string,
    chassi: string,
    renavam: string,
    excludeId?: string
  ): Promise<void> {
    const qb = this.vehiclesRepo
      .createQueryBuilder('v')
      .where('v.placa = :placa OR v.chassi = :chassi OR v.renavam = :renavam', {
        placa,
        chassi,
        renavam,
      });

    if (excludeId) {
      qb.andWhere('v.id != :excludeId', { excludeId });
    }

    const conflict = await qb.getOne();
    if (conflict) {
      throw new ConflictException(
        'Já existe um veículo com a mesma placa, chassi ou renavam'
      );
    }
  }
}
