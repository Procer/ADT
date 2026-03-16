import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('salespersons')
export class Salesperson {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nombre: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'porcentaje_comision', type: 'decimal', precision: 5, scale: 2, default: 10.00 })
    porcentajeComision: number; // 10% or 15%

    @Column({ name: 'bono_activacion', type: 'decimal', precision: 12, scale: 2, default: 0.00 })
    bonoActivacion: number;

    @OneToMany(() => Tenant, tenant => tenant.salesperson)
    tenants: Tenant[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
