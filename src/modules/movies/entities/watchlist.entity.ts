import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Movie } from './movie.entity';
import { User } from '../../users/entities/user.entity';

@Entity()
export class Watchlist {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Movie, (movie) => movie.watchlists)
  @JoinColumn()
  movie: Movie;

  @ManyToOne(() => User, (user) => user.watchlist)
  @JoinColumn()
  user: User;

  @CreateDateColumn()
  addedAt: Date;
}
