import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('travel_credits')
export class TravelCredit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant, tenant => tenant.credits)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ name: 'client_id', nullable: true })
    clientId: string;

    @Column('decimal', { name: 'precio_pagado_nominal', precision: 12, scale: 2, default: 0 })
    precioPagadoNominal: number;

    @Column({ name: 'patente_vinculada', length: 20, nullable: true })
    patenteVinculada: string;

    @Column({ name: 'chofer_vinculado', type: 'uuid', nullable: true })
    choferVinculado: string;

    @Column({ default: false })
    usado: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
