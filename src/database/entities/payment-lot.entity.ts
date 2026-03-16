import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Tenant } from './tenant.entity';
import { Driver } from './driver.entity';
import { LotDeduction } from './lot-deduction.entity';
import { CartaPorte } from './carta-porte.entity';

@Entity('payment_lotes')
export class PaymentLot {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'tenant_id' })
    tenantId: string;

    @ManyToOne(() => Tenant)
    @JoinColumn({ name: 'tenant_id' })
    tenant: Tenant;

    @Column({ name: 'chofer_id', type: 'uuid' })
    choferId: string;

    @ManyToOne(() => Driver)
    @JoinColumn({ name: 'chofer_id' })
    chofer: Driver;

    @Column('decimal', { name: 'total_bruto', precision: 12, scale: 2, default: 0 })
    totalBruto: number;

    @Column('decimal', { name: 'deducciones_total', precision: 12, scale: 2, default: 0 })
    deduccionesTotal: number;

    @Column('decimal', { name: 'neto_final', precision: 12, scale: 2, default: 0 })
    netoFinal: number;

    @Column({ name: 'comprobante_path', nullable: true })
    comprobantePath: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => LotDeduction, deduction => deduction.paymentLot)
    deducciones: LotDeduction[];

    @OneToMany(() => CartaPorte, trip => trip.paymentLot)
    trips: CartaPorte[];
}
