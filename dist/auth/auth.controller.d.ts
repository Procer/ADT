import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: {
        dni: string;
        pin: string;
    }): Promise<{
        access_token: string;
        driver: any;
        tenantConfig: any;
    }>;
    adminLogin(body: {
        email: string;
        pass: string;
    }): Promise<{
        access_token: string;
        user: any;
    }>;
    impersonate(body: {
        tenantId: string;
    }, req: any): Promise<{
        access_token: string;
        message: string;
    }>;
    changePassword(body: {
        newPass: string;
    }, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
