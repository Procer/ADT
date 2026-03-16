import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Public } from './public.decorator';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Public()
    @Post('login')
    async login(@Body() body: { dni: string; pin: string }) {
        return this.authService.login(body.dni, body.pin);
    }

    @Public()
    @Post('admin/login')
    async adminLogin(@Body() body: { email: string; pass: string }) {
        return this.authService.adminLogin(body.email, body.pass);
    }

    @UseGuards(JwtAuthGuard)
    @Post('impersonate')
    async impersonate(@Body() body: { tenantId: string }, @Req() req: any) {
        return this.authService.impersonate(body.tenantId, req.user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('change-password')
    async changePassword(@Body() body: { newPass: string }, @Req() req: any) {
        return this.authService.changePassword(req.user.userId, body.newPass);
    }
}
