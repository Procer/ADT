import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DriversService } from '../drivers/drivers.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../database/entities/user.entity';
import { Tenant } from '../database/entities/tenant.entity';
import { AuditLog } from '../database/entities/audit-log.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        private driversService: DriversService,
        private jwtService: JwtService,
        @InjectRepository(User) private readonly userRepo: Repository<User>,
        @InjectRepository(AuditLog) private readonly auditRepo: Repository<AuditLog>,
    ) { }

    async validateDriver(dni: string, pin: string): Promise<any> {
        console.log(`[AuthService] Intentando validar chofer DNI: "${dni}", PIN: "${pin}"`);
        const driver = await this.driversService.findByDni(dni);

        if (!driver) {
            console.log(`[AuthService] No se encontró chofer con DNI: "${dni}"`);
            return null;
        }

        console.log(`[AuthService] Chofer encontrado: ${driver.nombre}, su PIN en BD es: "${driver.pin}"`);

        if (driver.pin === pin) {
            // Check if tenant is active
            const tenant = await this.userRepo.manager.findOne(Tenant, { where: { id: driver.tenantId } });
            if (tenant && !tenant.activo) {
                console.log(`[AuthService] LOGIN BLOQUEADO: Tenant ${driver.tenantId} inactivo`);
                throw new UnauthorizedException('Cuenta de empresa desactivada. Contacte a soporte.');
            }

            const { pin: _pin, ...result } = driver;
            return result;
        }

        console.log(`[AuthService] El PIN no coincide. Esperado: "${driver.pin}", Recibido: "${pin}"`);
        return null;
    }

    async login(dni: string, pin: string) {
        console.log(`[AuthService] Recibido DNI: ${dni}, PIN: ${pin}`);
        const driver = await this.validateDriver(dni, pin);
        if (!driver) {
            console.log(`[AuthService] Falló validación para DNI: ${dni}`);
            throw new UnauthorizedException('Credenciales inválidas');
        }
        const payload = { sub: driver.id, tenantId: driver.tenantId, role: 'DRIVER' };
        console.log(`[ADT-DEBUG] Generando JWT para chofer: ${driver.nombre} [DNI: ${dni}] [sub/UUID: ${driver.id}]`);

        const tenant = await this.userRepo.manager.findOne(Tenant, { where: { id: driver.tenantId } });

        // AUDITORIA LOGIN CHOFER
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

    async validateUser(email: string, pass: string): Promise<any> {
        console.log(`[AuthService] Validando usuario: ${email}`);
        const user = await this.userRepo.findOne({ where: { email } });
        if (!user) {
            console.log(`[AuthService] Usuario no encontrado: ${email}`);
            return null;
        }

        const passMatch = await bcrypt.compare(pass, user.passwordHash);
        if (passMatch) {
            console.log(`[AuthService] Password coincide para ${email}`);
            // Check if tenant is active (if not Super Admin)
            if (user.role !== UserRole.SUPER_ADMIN && user.tenantId) {
                const tenant = await this.userRepo.manager.findOne(Tenant, { where: { id: user.tenantId } });
                if (tenant && !tenant.activo) {
                    console.log(`[AuthService] Tenant inactivo para ${email}: ${user.tenantId}`);
                    throw new UnauthorizedException('Cuenta de empresa desactivada. Contacte a soporte.');
                }
            }
            const { passwordHash, ...result } = user;
            return result;
        } else {
            console.log(`[AuthService] Password NO coincide para ${email}`);
        }
        return null;
    }

    async adminLogin(email: string, pass: string) {
        console.log(`[AuthService] Intento de login admin: ${email}`);
        const user = await this.validateUser(email, pass);
        if (!user) {
            console.log(`[AuthService] Falló login admin para ${email}`);
            throw new UnauthorizedException('Credenciales de administrador inválidas');
        }
        const payload = { sub: user.id, tenantId: user.tenantId, role: user.role, clientId: user.clientId };

        // AUDITORIA LOGIN ADMIN
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

    async impersonate(tenantId: string, currentUser: any) {
        if (currentUser.role !== UserRole.SUPER_ADMIN) {
            throw new UnauthorizedException('Solo el Super Admin puede impersonar');
        }

        const payload = {
            sub: currentUser.userId,
            tenantId,
            role: UserRole.TENANT_ADMIN,
            isImpersonating: true,
            realUserId: currentUser.userId
        };

        return {
            access_token: this.jwtService.sign(payload),
            message: `Impersonación activada para el tenant ${tenantId}`
        };
    }

    async changePassword(userId: string, newPass: string) {
        const user = await this.userRepo.findOne({ where: { id: userId } });
        if (!user) throw new BadRequestException('Usuario no encontrado');

        user.passwordHash = await bcrypt.hash(newPass, 10);
        user.mustChangePassword = false;
        await this.userRepo.save(user);

        // Generar aviso en Audit Log para el administrador
        await this.auditRepo.save(this.auditRepo.create({
            tenantId: user.tenantId,
            usuarioId: user.id,
            accion: 'PASSWORD_CHANGED',
            descripcion: `El usuario ${user.email} ha actualizado su contraseña exitosamente.`,
            resueltoPor: 'Sistema'
        }));

        return { success: true, message: 'Contraseña actualizada' };
    }
}
