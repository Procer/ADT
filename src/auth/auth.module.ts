import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DriversModule } from '../drivers/drivers.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../database/entities/user.entity';
import { AuditLog } from '../database/entities/audit-log.entity';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([User, AuditLog]),
        DriversModule,
        PassportModule,
        JwtModule.register({
            secret: 'SECRET_KEY_ADT_2026',
            signOptions: { expiresIn: '60d' },
        }),
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
