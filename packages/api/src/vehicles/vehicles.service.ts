import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { Vehicle } from './vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { ListVehiclesQueryDto } from './dto/list-vehicles-query.dto';
import { KafkaProducerService } from '../kafka/kafka-producer.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehiclesRepository: Repository<Vehicle>,
    private readonly kafkaProducer: KafkaProducerService
  ) {}

  async findAll(
    query: ListVehiclesQueryDto
  ): Promise<PaginatedResult<Vehicle>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.vehiclesRepository.createQueryBuilder('v');

    if (query.placa)
      qb.andWhere('v.placa LIKE :placa', { placa: `%${query.placa}%` });
    if (query.chassi)
      qb.andWhere('v.chassi LIKE :chassi', { chassi: `%${query.chassi}%` });
    if (query.renavam)
      qb.andWhere('v.renavam LIKE :renavam', { renavam: `%${query.renavam}%` });
    if (query.modelo)
      qb.andWhere('v.modelo LIKE :modelo', { modelo: `%${query.modelo}%` });
    if (query.marca)
      qb.andWhere('v.marca LIKE :marca', { marca: `%${query.marca}%` });
    if (query.ano) qb.andWhere('v.ano = :ano', { ano: query.ano });

    qb.orderBy('v.createdAt', 'DESC')
      .addOrderBy('v.rowid', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Vehicle> {
    const vehicle = await this.vehiclesRepository.findOneBy({ id });
    if (!vehicle) {
      throw new NotFoundException(`Veículo com id "${id}" não encontrado`);
    }
    return vehicle;
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    await this.ensureUnique(dto.placa, dto.chassi, dto.renavam);
    const vehicle = this.vehiclesRepository.create(dto);
    const saved = await this.vehiclesRepository.save(vehicle);
    this.kafkaProducer.emitVehicleEvent({
      action: 'CREATED',
      entityId: saved.id,
      before: null,
      after: { ...saved },
      timestamp: new Date().toISOString(),
    });
    return saved;
  }

  async update(id: string, dto: UpdateVehicleDto): Promise<Vehicle> {
    const existing = await this.findOne(id);
    const before = { ...existing };
    await this.ensureUnique(
      dto.placa ?? existing.placa,
      dto.chassi ?? existing.chassi,
      dto.renavam ?? existing.renavam,
      id
    );
    Object.assign(existing, dto);
    const saved = await this.vehiclesRepository.save(existing);
    this.kafkaProducer.emitVehicleEvent({
      action: 'UPDATED',
      entityId: saved.id,
      before,
      after: { ...saved },
      timestamp: new Date().toISOString(),
    });
    return saved;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.findOne(id);
    await this.vehiclesRepository.delete(id);
    this.kafkaProducer.emitVehicleEvent({
      action: 'DELETED',
      entityId: id,
      before: { ...existing },
      after: null,
      timestamp: new Date().toISOString(),
    });
  }

  private async ensureUnique(
    placa: string,
    chassi: string,
    renavam: string,
    excludeId?: string
  ): Promise<void> {
    const not = excludeId ? { id: Not(excludeId) } : {};
    const conflict = await this.vehiclesRepository.findOne({
      where: [
        { ...not, placa },
        { ...not, chassi },
        { ...not, renavam },
      ],
    });

    if (conflict) {
      throw new ConflictException(
        'Já existe um veículo com a mesma placa, chassi ou renavam'
      );
    }
  }
}
