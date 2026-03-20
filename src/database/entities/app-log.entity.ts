
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export enum LogLevel {
    INFO = 'INFO',
    WARN = 'WARN',
    ERROR = 'ERROR',
    CRITICAL = 'CRITICAL'
}

@Entity('app_logs')
export class AppLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @CreateDateColumn({ name: 'ts_log' })
    timestamp: Date;

    @Column({ name: 'contexto', length: 100 })
    contexto: string; // Ej: SMTP_SERVICE, BILLING, AI_COPILOT

    @Column({ name: 'level', type: 'varchar', length: 20, default: LogLevel.ERROR })
    level: LogLevel;

    @Column({ name: 'mensaje', type: 'text' })
    mensaje: string;

    @Column({ name: 'metadata', type: 'text', nullable: true })
    metadata: string; // JSON con stack trace o datos de la petición

    @Column({ name: 'user_id', type: 'varchar', length: 255, nullable: true })
    userId: string | null; // Si el error fue de un usuario logueado

    @Column({ name: 'tenant_id', type: 'varchar', length: 255, nullable: true })
    tenantId: string | null;
}
