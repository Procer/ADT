import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, OneToMany } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CartaPorte } from './carta-porte.entity';

@Entity('transport_units')
@Unique(['tenantId', 'patente'])
export class TransportUnit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @Column({ name: 'vencimiento_vtv', type: 'date', nullable: true })
    vencimientoVTV: Date;

    @Column({ name: 'vencimiento_seguro', type: 'date', nullable: true })
    vencimientoSeguro: Date;

    @Column({ name: 'vencimiento_ruta', type: 'date', nullable: true })
    vencimientoRuta: Date;

    @Column({ name: 'odometro_actual', type: 'int', default: 0 })
    odometroActual: number;

    @Column({ name: 'km_inicial', type: 'int', default: 0 })
    kmInicial: number;

    @ManyToOne(() => Tenant, tenant => tenant.units)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ length: 20 })
    patente: string;

    @Column({ nullable: true })
    marca: string;

    @Column({ nullable: true })
    modelo: string;

    @Column({ name: 'status_habilitacion', default: true })
    statusHabilitacion: boolean;

    @OneToMany(() => CartaPorte, trip => trip.unidad)
    trips: CartaPorte[];
}
