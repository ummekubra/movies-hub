import { Entity, Column, PrimaryGeneratedColumn, ManyToMany } from 'typeorm';
import { Movie } from './movie.entity';

@Entity()
export class Genre {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  tmdbId: number;

  @Column()
  name: string;

  @ManyToMany(() => Movie, (movie) => movie.genres)
  movies: Movie[];
}
