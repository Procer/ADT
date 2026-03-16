import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('audit_logs')
export class AuditLog {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: string;

    @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
    usuarioId: string;

    @Column({ type: 'nvarchar', length: 255 })
    accion: string;

    @Column('text', { nullable: true })
    descripcion: string;

    @Column({ type: 'simple-json', name: 'data_anterior', nullable: true })
    dataAnterior: any;

    @Column({ type: 'simple-json', name: 'data_nueva', nullable: true })
    dataNueva: any;

    @Column({ name: 'tenant_id', type: 'uuid', nullable: true })
    tenantId: string;

    @Column({ default: false })
    resuelto: boolean;

    @Column({ name: 'comentario_resolucion', type: 'nvarchar', length: 'max', nullable: true })
    comentarioResolucion: string;

    @Column({ name: 'resuelto_por', type: 'nvarchar', length: 255, nullable: true })
    resueltoPor: string;

    @CreateDateColumn({ name: 'fecha' })
    fecha: Date;
}
