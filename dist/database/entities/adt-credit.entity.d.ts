import { Client } from './client.entity';
export declare class AdtCredit {
    id: string;
    clientId: string;
    client: Client;
    tripIdOriginal: string;
    montoNominalOriginal: number;
    status: string;
    createdAt: Date;
}
