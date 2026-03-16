import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Client } from './client.entity';

@Entity('adt_credits')
export class AdtCredit {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'client_id', type: 'uuid' })
    clientId: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'trip_id_original', type: 'uuid' })
    tripIdOriginal: string;

    @Column('decimal', { name: 'monto_nominal_original', precision: 12, scale: 2 })
    montoNominalOriginal: number;

    @Column({ default: 'DISPONIBLE' })
    status: string; // DISPONIBLE, USADO

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
