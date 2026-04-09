import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 20 })
  action: string;

  @Column({ length: 50 })
  entityType: string;

  @Column({ length: 36 })
  entityId: string;

  @Column({ type: 'text', nullable: true })
  before: string | null;

  @Column({ type: 'text', nullable: true })
  after: string | null;

  @CreateDateColumn()
  timestamp: Date;
}
