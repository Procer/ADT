import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: 'SECRET_KEY_ADT_2026', // In production use environment variables
        });
    }

    async validate(payload: any) {
        return { userId: payload.sub, tenantId: payload.tenantId, role: payload.role, clientId: payload.clientId };
    }
}
