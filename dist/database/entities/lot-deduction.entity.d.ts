import { PaymentLot } from './payment-lot.entity';
export declare class LotDeduction {
    id: string;
    paymentLotId: string;
    paymentLot: PaymentLot;
    monto: number;
    descripcion: string;
    tipo: string;
}
