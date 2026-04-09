import { Test, TestingModule } from '@nestjs/testing';
import { KafkaProducerService, VehicleEvent } from './kafka-producer.service';

const mockKafkaClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
  emit: jest.fn(),
};

describe('KafkaProducerService', () => {
  let service: KafkaProducerService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        KafkaProducerService,
        { provide: 'KAFKA_SERVICE', useValue: mockKafkaClient },
      ],
    }).compile();

    service = module.get<KafkaProducerService>(KafkaProducerService);
  });

  it('should connect to Kafka', async () => {
    await service.connect();
    expect(mockKafkaClient.connect).toHaveBeenCalled();
  });

  it('should disconnect from Kafka', async () => {
    await service.disconnect();
    expect(mockKafkaClient.close).toHaveBeenCalled();
  });

  it('should emit a vehicle event to the correct topic', () => {
    const event: VehicleEvent = {
      action: 'CREATED',
      entityId: 'uuid-1',
      before: null,
      after: { placa: 'ABC1D23' },
      timestamp: new Date().toISOString(),
    };

    service.emitVehicleEvent(event);
    expect(mockKafkaClient.emit).toHaveBeenCalledWith('vehicles.events', event);
  });
});
