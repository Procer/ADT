import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from './tenant.entity';
import { CartaPorte } from './carta-porte.entity';

@Entity('drivers')
export class Driver {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @Column({ name: 'fecha_nacimiento', type: 'date', nullable: true })
    fechaNacimiento: Date;

    @Column({ name: 'fecha_ingreso', type: 'date', nullable: true })
    fechaIngreso: Date;

    @Column({ name: 'telefono_emergencia', nullable: true })
    telefonoEmergencia: string;

    @ManyToOne(() => Tenant, tenant => tenant.drivers)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column()
    nombre: string;

    @Column({ unique: true, nullable: true })
    dni: string;

    @Column({ nullable: true })
    email: string;

    @Column({ name: 'telegram_user', nullable: true })
    telegramUser: string;

    @Column({ name: 'telegram_chat_id', nullable: true })
    telegramChatId: string;

    @Column({ nullable: true })
    telefono: string;

    @Column({ name: 'licencia_numero', nullable: true })
    licenciaNumero: string;

    @Column({ name: 'licencia_categoria', nullable: true })
    licenciaCategoria: string;

    @Column({ nullable: true })
    art: string;

    @Column({ name: 'vencimiento_licencia', type: 'date', nullable: true })
    vencimientoLicencia: Date;

    @Column({ name: 'score_confianza', default: 100 })
    scoreConfianza: number;

    @Column({ nullable: true })
    pin: string;

    @Column({ name: 'device_id_vinculado', nullable: true })
    deviceIdVinculado: string;

    @Column({ name: 'payment_cycle', type: 'nvarchar', length: 20, default: 'SEMANAL' })
    paymentCycle: string; // 'DIARIO', 'SEMANAL', 'QUINCENAL', 'MENSUAL'

    @Column({ name: 'ultimo_login', nullable: true })
    ultimoLogin: Date;

    @OneToMany(() => CartaPorte, trip => trip.chofer)
    trips: CartaPorte[];
}
