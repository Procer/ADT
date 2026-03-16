import { Client } from './client.entity';
export declare class ClientAuthorizedEmail {
    id: string;
    clientId: string;
    client: Client;
    emailAutorizado: string;
    asuntoClave: string;
    createdAt: Date;
}
