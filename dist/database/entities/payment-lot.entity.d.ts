import { Tenant } from './tenant.entity';
import { Driver } from './driver.entity';
import { LotDeduction } from './lot-deduction.entity';
import { CartaPorte } from './carta-porte.entity';
export declare class PaymentLot {
    id: string;
    tenantId: string;
    tenant: Tenant;
    choferId: string;
    chofer: Driver;
    totalBruto: number;
    deduccionesTotal: number;
    netoFinal: number;
    comprobantePath: string;
    createdAt: Date;
    deducciones: LotDeduction[];
    trips: CartaPorte[];
}
