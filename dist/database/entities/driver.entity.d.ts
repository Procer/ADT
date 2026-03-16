import { Tenant } from './tenant.entity';
import { CartaPorte } from './carta-porte.entity';
export declare class Driver {
    id: string;
    tenantId: string;
    fechaNacimiento: Date;
    fechaIngreso: Date;
    telefonoEmergencia: string;
    tenant: Tenant;
    nombre: string;
    dni: string;
    email: string;
    telegramUser: string;
    telegramChatId: string;
    telefono: string;
    licenciaNumero: string;
    licenciaCategoria: string;
    art: string;
    vencimientoLicencia: Date;
    scoreConfianza: number;
    pin: string;
    deviceIdVinculado: string;
    paymentCycle: string;
    ultimoLogin: Date;
    trips: CartaPorte[];
}
