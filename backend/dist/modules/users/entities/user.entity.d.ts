import { Portfolio } from '../../portfolio/entities/portfolio.entity';
export declare class User {
    id: string;
    email: string;
    password: string;
    createdAt: Date;
    portfolio?: Portfolio;
}
