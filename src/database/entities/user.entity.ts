import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    TENANT_ADMIN = 'TENANT_ADMIN',
    CLIENT = 'CLIENT',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({ name: 'password_hash' })
    passwordHash: string;

    @Column({
        type: 'varchar',
        length: 20,
        default: UserRole.TENANT_ADMIN,
    })
    role: UserRole;

    @Column({ name: 'tenant_id', nullable: true })
    tenantId: string;

    @ManyToOne(() => Tenant, { nullable: true })
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ name: 'client_id', nullable: true })
    clientId: string;

    @Column({ name: 'nombre_completo' })
    nombreCompleto: string;

    @Column({ name: 'telegram_chat_id', nullable: true })
    telegramChatId: string;

    @Column({ default: false, name: 'must_change_password' })
    mustChangePassword: boolean;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
