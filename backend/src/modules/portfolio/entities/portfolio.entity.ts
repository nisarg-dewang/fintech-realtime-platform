import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Position } from './position.entity';

@Entity('portfolios')
export class Portfolio {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  @OneToOne(() => User, (user) => user.portfolio)
  @JoinColumn()
  user: User;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 100000 })
  balance: string;

  @OneToMany(() => Position, (position) => position.portfolio)
  positions: Position[];
}
