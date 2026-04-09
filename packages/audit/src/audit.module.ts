import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'data/audit.sqlite',
      entities: [AuditLog],
      synchronize: true,
    }),
    TypeOrmModule.forFeature([AuditLog]),
  ],
  controllers: [AuditController],
  providers: [AuditService],
})
export class AuditModule {}
