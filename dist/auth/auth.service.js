"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const drivers_service_1 = require("../drivers/drivers.service");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("../database/entities/user.entity");
const tenant_entity_1 = require("../database/entities/tenant.entity");
const audit_log_entity_1 = require("../database/entities/audit-log.entity");
const bcrypt = __importStar(require("bcrypt"));
let AuthService = class AuthService {
    driversService;
    jwtService;
    userRepo;
    auditRepo;
    constructor(driversService, jwtService, userRepo, auditRepo) {
        this.driversService = driversService;
        this.jwtService = jwtService;
        this.userRepo = userRepo;
        this.auditRepo = auditRepo;
    }
    async validateDriver(dni, pin) {
        console.log(`[AuthService] Intentando validar chofer DNI: "${dni}", PIN: "${pin}"`);
        const driver = await this.driversService.findByDni(dni);
        if (!driver) {
            console.log(`[AuthService] No se encontró chofer con DNI: "${dni}"`);
            return null;
        }
        console.log(`[AuthService] Chofer encontrado: ${driver.nombre}, su PIN en BD es: "${driver.pin}"`);
        if (driver.pin === pin) {
            const tenant = await this.userRepo.manager.findOne(tenant_entity_1.Tenant, { where: { id: driver.tenantId } });
            if (tenant && !tenant.activo) {
                console.log(`[AuthService] LOGIN BLOQUEADO: Tenant ${driver.tenantId} inactivo`);
                throw new common_1.UnauthorizedException('Cuenta de empresa desactivada. Contacte a soporte.');
            }
            const { pin: _pin, ...result } = driver;
            return result;
        }
        console.log(`[AuthService] El PIN no coincide. Esperado: "${driver.pin}", Recibido: "${pin}"`);
        return null;
    }
    async login(dni, pin) {
        console.log(`[AuthService] Recibido DNI: ${dni}, PIN: ${pin}`);
        const driver = await this.validateDriver(dni, pin);
        if (!driver) {
            console.log(`[AuthService] Falló validación para DNI: ${dni}`);
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const payload = { sub: driver.id, tenantId: driver.tenantId, role: 'DRIVER' };
        console.log(`[ADT-DEBUG] Generando JWT para chofer: ${driver.nombre} [DNI: ${dni}] [sub/UUID: ${driver.id}]`);
        const tenant = await this.userRepo.manager.findOne(tenant_entity_1.Tenant, { where: { id: driver.tenantId } });
        await this.auditRepo.save({
            tenantId: driver.tenantId,
            accion: 'LOGIN_CHOFER',
            descripcion: `El chofer ${driver.nombre} ha iniciado sesión en la PWA.`,
            resueltoPor: 'Sistema'
        });
        return {
            access_token: this.jwtService.sign(payload),
            driver,
            tenantConfig: tenant?.config || {}
        };
    }
    async validateUser(email, pass) {
        console.log(`[AuthService] Validando usuario: ${email}`);
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            console.log(`[AuthService] Usuario no encontrado: ${email}`);
            return null;
        }
        const passMatch = await bcrypt.compare(pass, user.passwordHash);
        if (passMatch) {
            console.log(`[AuthService] Password coincide para ${email}`);
            if (user.role !== user_entity_1.UserRole.SUPER_ADMIN && user.tenantId) {
                const tenant = await this.userRepo.manager.findOne(tenant_entity_1.Tenant, { where: { id: user.tenantId } });
                if (tenant && !tenant.activo) {
                    console.log(`[AuthService] Tenant inactivo para ${email}: ${user.tenantId}`);
                    throw new common_1.UnauthorizedException('Cuenta de empresa desactivada. Contacte a soporte.');
                }
            }
            const { passwordHash, ...result } = user;
            return result;
        }
        else {
            console.log(`[AuthService] Password NO coincide para ${email}`);
        }
        return null;
    }
    async adminLogin(email, pass) {
        console.log(`[AuthService] Intento de login admin: ${email}`);
        const user = await this.validateUser(email, pass);
        if (!user) {
            console.log(`[AuthService] Falló login admin para ${email}`);
            throw new common_1.UnauthorizedException('Credenciales de administrador inválidas');
        }
        const payload = { sub: user.id, tenantId: user.tenantId, role: user.role, clientId: user.clientId };
        await this.auditRepo.save({
            tenantId: user.tenantId,
            usuarioId: user.id,
            accion: 'LOGIN_ADMIN',
            descripcion: `El usuario ${user.email} ha iniciado sesión en el Dashboard.`,
            resueltoPor: 'Sistema'
        });
        return {
            access_token: this.jwtService.sign(payload),
            user
        };
    }
    async impersonate(tenantId, currentUser) {
        if (currentUser.role !== user_entity_1.UserRole.SUPER_ADMIN) {
            throw new common_1.UnauthorizedException('Solo el Super Admin puede impersonar');
        }
        const payload = {
            sub: currentUser.userId,
            tenantId,
            role: user_entity_1.UserRole.TENANT_ADMIN,
            isImpersonating: true,
            realUserId: currentUser.userId
        };
        return {
            access_token: this.jwtService.sign(payload),
            message: `Impersonación activada para el tenant ${tenantId}`
        };
    }
    async changePassword(userId, newPass) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user)
            throw new common_1.BadRequestException('Usuario no encontrado');
        user.passwordHash = await bcrypt.hash(newPass, 10);
        user.mustChangePassword = false;
        await this.userRepo.save(user);
        await this.auditRepo.save(this.auditRepo.create({
            tenantId: user.tenantId,
            usuarioId: user.id,
            accion: 'PASSWORD_CHANGED',
            descripcion: `El usuario ${user.email} ha actualizado su contraseña exitosamente.`,
            resueltoPor: 'Sistema'
        }));
        return { success: true, message: 'Contraseña actualizada' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(3, (0, typeorm_1.InjectRepository)(audit_log_entity_1.AuditLog)),
    __metadata("design:paramtypes", [drivers_service_1.DriversService,
        jwt_1.JwtService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map