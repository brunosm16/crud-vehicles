import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AuditModule } from './audit.module';

async function bootstrap() {
  const app = await NestFactory.create(AuditModule);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'audit-service',
        brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9094').split(','),
      },
      consumer: {
        groupId: 'audit-consumer-group',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Audit service running on http://localhost:${port}`);
}
bootstrap();
