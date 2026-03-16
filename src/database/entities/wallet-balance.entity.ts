import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Client } from './client.entity';

@Entity('billetera_saldos')
export class WalletBalance {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @Column({ name: 'client_id', nullable: true })
    clientId: string | null;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'saldo_creditos', default: 0 })
    saldoCreditos: number;

    @UpdateDateColumn({ name: 'last_update' })
    lastUpdate: Date;
}
