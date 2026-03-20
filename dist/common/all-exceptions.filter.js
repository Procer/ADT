"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const app_log_entity_1 = require("../database/entities/app-log.entity");
let AllExceptionsFilter = class AllExceptionsFilter {
    dataSource;
    logger = new common_1.Logger('SystemError');
    constructor(dataSource) {
        this.dataSource = dataSource;
    }
    async catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException
            ? exception.getStatus()
            : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const message = exception instanceof common_1.HttpException
            ? exception.getResponse()
            : exception.message || 'Internal server error';
        this.logger.error(`[ERROR ${status}] ${request.method} ${request.url}: ${JSON.stringify(message)}`);
        try {
            const queryRunner = this.dataSource.createQueryRunner();
            await queryRunner.connect();
            const logRepo = queryRunner.manager.getRepository(app_log_entity_1.AppLog);
            const appLog = logRepo.create({
                contexto: `HTTP_${request.method}_${request.url.split('?')[0]}`,
                level: status >= 500 ? app_log_entity_1.LogLevel.CRITICAL : app_log_entity_1.LogLevel.ERROR,
                mensaje: typeof message === 'object' ? JSON.stringify(message) : message,
                metadata: JSON.stringify({
                    stack: exception.stack,
                    body: request.body,
                    query: request.query,
                    status
                }),
                userId: request.user?.id || null,
                tenantId: request.user?.tenantId || null
            });
            await logRepo.save(appLog);
            await queryRunner.release();
        }
        catch (dbError) {
            this.logger.error('FALLO AL GUARDAR LOG EN DB: ' + dbError.message);
        }
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message: status >= 500 ? 'Error crítico del sistema' : (typeof message === 'object' ? message.message : message)
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource])
], AllExceptionsFilter);
//# sourceMappingURL=all-exceptions.filter.js.map