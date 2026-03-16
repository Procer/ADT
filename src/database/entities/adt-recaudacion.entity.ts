import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { User } from './user.entity';

@Entity('adt_recaudaciones')
export class AdtRecaudacion {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ default: 'PENDIENTE' })
    status: string; // PENDIENTE, COBRADO

    @Column('decimal', { precision: 12, scale: 2 })
    monto: number;

    @CreateDateColumn({ name: 'fecha_recaudo' })
    fechaRecaudo: Date;

    @Column({ name: 'admin_id', type: 'uuid', nullable: true })
    adminId: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'admin_id' })
    admin: User; // Auditoría
}
