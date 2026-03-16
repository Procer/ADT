import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity('tenant_payments')
export class TenantPayment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column('decimal', { precision: 12, scale: 2 })
    monto: number;

    @Column({ nullable: true })
    referencia: string; // Ej: Transferencia Bancaria #12345

    @Column({ name: 'metodo_pago', nullable: true })
    metodoPago: string; // Efectivo, Transferencia, etc.

    @Column({ name: 'comprobante_url', nullable: true, type: 'nvarchar', length: 'max' })
    comprobanteUrl: string;

    @Column({ nullable: true })
    periodo: string; // Ej: "Enero 2026"

    @CreateDateColumn({ name: 'fecha_pago' })
    fechaPago: Date;

    @Column({ name: 'registrado_por', nullable: true })
    registradoPor: string; // Nombre del Super Admin que lo cargó
}
