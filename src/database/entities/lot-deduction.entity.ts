import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PaymentLot } from './payment-lot.entity';

@Entity('lote_deducciones')
export class LotDeduction {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'payment_lot_id' })
    paymentLotId: string;

    @ManyToOne(() => PaymentLot, lot => lot.deducciones)
    @JoinColumn({ name: 'payment_lot_id' })
    paymentLot: PaymentLot;

    @Column('decimal', { precision: 12, scale: 2 })
    monto: number;

    @Column()
    descripcion: string;

    @Column({ name: 'tipo', length: 50 })
    tipo: string; // ANTICIPO, MULTA, DANOS, OTROS
}
