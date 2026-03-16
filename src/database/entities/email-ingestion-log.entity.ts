import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('email_ingestion_logs')
export class EmailIngestionLog {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
    tenantId: string;

    @Column()
    remitente: string;

    @Column({ type: 'nvarchar', length: 'max' })
    asunto: string;

    @Column({ name: 'cuerpo_raw', type: 'nvarchar', length: 'max' })
    cuerpoRaw: string;

    @Column({ name: 'json_extraido', type: 'simple-json', nullable: true })
    jsonExtraido: any;

    @Column({ name: 'estado_ingesta', length: 50 })
    estadoIngesta: 'EXITOSO' | 'RECHAZADO_FILTRO' | 'ERROR_IA' | 'ERROR_TECNICO';

    @Column({ name: 'error_detalle', type: 'nvarchar', length: 'max', nullable: true })
    errorDetalle: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
