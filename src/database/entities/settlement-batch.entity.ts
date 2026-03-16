import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('settlement_batches')
export class SettlementBatch {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id', type: 'uniqueidentifier' })
    tenantId: string;

    @Column({ name: 'entity_type', type: 'nvarchar', length: 20 }) // 'DADOR' o 'CHOFER'
    entityType: string;

    @Column({ name: 'entity_id', type: 'uniqueidentifier' })
    entityId: string;

    @Column({ name: 'period_start', type: 'date' })
    periodStart: Date;

    @Column({ name: 'period_end', type: 'date' })
    periodEnd: Date;

    @Column({ name: 'total_net', type: 'decimal', precision: 15, scale: 2 })
    totalNet: number;

    @Column({ type: 'nvarchar', length: 20, default: 'OPEN' }) // 'OPEN', 'SETTLED', 'PAID'
    status: string;

    @Column({ name: 'pdf_url', type: 'nvarchar', length: 'max', nullable: true })
    pdfUrl: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
