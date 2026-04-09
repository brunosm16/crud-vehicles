import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 10 })
  placa: string;

  @Column({ unique: true, length: 17 })
  chassi: string;

  @Column({ unique: true, length: 11 })
  renavam: string;

  @Column({ length: 100 })
  modelo: string;

  @Column({ length: 50 })
  marca: string;

  @Column({ type: 'int' })
  ano: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
