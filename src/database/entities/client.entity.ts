import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CartaPorte } from './carta-porte.entity';

@Entity('clients')
export class Client {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'nombre_razon_social' })
    nombreRazonSocial: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ name: 'moneda_preferida', default: 'ARS', length: 3 })
    monedaPreferida: string;

    @Column({ name: 'precio_por_cp', type: 'decimal', precision: 12, scale: 2, default: 0 })
    precioPorCp: number;

    @Column({ name: 'notify_new_trip', default: true })
    notifyNewTrip: boolean;

    @Column({ name: 'notify_speeding', default: true })
    notifySpeeding: boolean;

    @Column({ name: 'notify_settlement', default: true })
    notifySettlement: boolean;

    @Column({ name: 'asunto_clave', default: 'SOLICITUD VIAJE' })
    asuntoClave: string;

    @OneToMany(() => CartaPorte, trip => trip.client)
    trips: CartaPorte[];

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
