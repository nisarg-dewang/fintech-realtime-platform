import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
    }>;
    login(email: string, password: string): Promise<{
        access_token: string;
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
    }>;
    tokenResponse(user: User): {
        access_token: string;
        user: {
            id: string;
            email: string;
            createdAt: Date;
        };
    };
}
