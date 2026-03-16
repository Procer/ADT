import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*', // In production, restrict to your dashboard/pwa URLs
    },
})
export class GpsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private logger: Logger = new Logger('GpsGateway');

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    emitGpsPing(pingData: any) {
        // Emit to all connected clients (Dashboard)
        // In a multi-tenant app, you'd use rooms: this.server.to(tenantId).emit(...)
        this.server.emit('gpsUpdate', pingData);
    }
}
