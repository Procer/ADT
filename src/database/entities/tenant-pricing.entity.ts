import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('tenant_pricing')
export class TenantPricing {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant, tenant => tenant.pricings)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column('decimal', { precision: 12, scale: 2, name: 'precio_cp' })
    precioCp: number;

    @Column({ default: 'ARS' })
    moneda: string;

    @CreateDateColumn({ name: 'fecha_desde' })
    fechaDesde: Date;
}
