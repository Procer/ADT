import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Client } from './client.entity';

@Entity('client_authorized_emails')
export class ClientAuthorizedEmail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'client_id' })
    clientId: string;

    @ManyToOne(() => Client)
    @JoinColumn({ name: 'client_id' })
    client: Client;

    @Column({ name: 'email_autorizado', unique: true })
    emailAutorizado: string;

    @Column({ name: 'asunto_clave', default: 'SOLICITUD VIAJE' })
    asuntoClave: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
