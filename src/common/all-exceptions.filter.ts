
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppLog, LogLevel } from '../database/entities/app-log.entity';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger('SystemError');

    constructor(private dataSource: DataSource) { }

    async catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const message = exception instanceof HttpException
            ? exception.getResponse()
            : (exception as Error).message || 'Internal server error';

        // Log en Consola
        this.logger.error(`[ERROR ${status}] ${request.method} ${request.url}: ${JSON.stringify(message)}`);

        // EXTRA CRÍTICO: Persistir en Base de Datos para el Super Admin
        try {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();

            const logRepo = queryRunner.manager.getRepository(AppLog);
            const appLog = logRepo.create({
                contexto: `HTTP_${request.method}_${request.url.split('?')[0]}`,
                level: status >= 500 ? LogLevel.CRITICAL : LogLevel.ERROR,
                mensaje: typeof message === 'object' ? JSON.stringify(message) : message,
                metadata: JSON.stringify({
                    stack: (exception as Error).stack,
                    body: request.body,
                    query: request.query,
                    status
                }),
                userId: request.user?.id || null,
                tenantId: request.user?.tenantId || null
            });

            await logRepo.save(appLog);
            await queryRunner.release();
        } catch (dbError) {
            this.logger.error('FALLO AL GUARDAR LOG EN DB: ' + dbError.message);
        }

        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: status >= 500 ? 'Error crítico del sistema' : (typeof message === 'object' ? (message as any).message : message)
        });
    }
}
