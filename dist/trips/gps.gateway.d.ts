import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class GpsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    emitGpsPing(pingData: any): void;
}
