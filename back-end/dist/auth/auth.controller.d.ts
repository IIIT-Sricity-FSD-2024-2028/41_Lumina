import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: {
        User_ID: string;
        Password: string;
    }): Record<string, any>;
}
