import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Client } from './client.entity';
import { CartaPorte } from './carta-porte.entity';

@Entity('financial_lotes')
export class FinancialLot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ name: 'client_id', type: 'uuid' })
    clientId: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column('decimal', { name: 'total_neto', precision: 12, scale: 2, default: 0 })
    totalNeto: number;

    @Column({ default: 'PENDIENTE' })
    status: string; // PENDIENTE, PROFORMADO, CONCILIADO

    @Column({ name: 'proforma_path', nullable: true })
    proformaPath: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @OneToMany(() => CartaPorte, trip => trip.financialLot)
    trips: CartaPorte[];
}
