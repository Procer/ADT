import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('pricing_rules')
export class PricingRule {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id', type: 'uniqueidentifier' })
    tenantId: string;

    @Column({ name: 'entity_type', type: 'nvarchar', length: 20 }) // 'DADOR' o 'CHOFER'
    entityType: string;

    @Column({ name: 'entity_id', type: 'uniqueidentifier' })
    entityId: string;

    @Column({ name: 'base_calculation', type: 'nvarchar', length: 20 }) // 'KM', 'FIXED', 'TON', 'HOUR', 'PERCENTAGE'
    baseCalculation: string;

    @Column({ name: 'base_value', type: 'decimal', precision: 15, scale: 2 })
    baseValue: number;

    @Column({ type: 'simple-json', nullable: true })
    conditionals: {
        espera_hora?: number;
        nocturno_plus?: number;
        umbral_espera_hs?: number;
        [key: string]: any;
    };

    @Column({ name: 'valid_from', type: 'datetime2' })
    validFrom: Date;

    @Column({ name: 'valid_to', type: 'datetime2', nullable: true })
    validTo: Date;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
