import { User } from '../../users/entities/user.entity';
import { Position } from './position.entity';
export declare class Portfolio {
    id: string;
    userId: string;
    user: User;
    balance: string;
    positions: Position[];
}
