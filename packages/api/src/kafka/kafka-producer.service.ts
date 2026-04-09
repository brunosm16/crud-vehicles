import { Inject, Injectable } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

export interface VehicleEvent {
  action: 'CREATED' | 'UPDATED' | 'DELETED';
  entityId: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  timestamp: string;
}

@Injectable()
export class KafkaProducerService {
  constructor(@Inject('KAFKA_SERVICE') private readonly kafka: ClientKafka) {}

  async connect() {
    await this.kafka.connect();
  }

  async disconnect() {
    await this.kafka.close();
  }

  emitVehicleEvent(event: VehicleEvent) {
    this.kafka.emit('vehicles.events', event);
  }
}
