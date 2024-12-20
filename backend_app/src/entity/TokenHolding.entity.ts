import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity({name: "tokenHolding"})
@Unique(['userAddress', 'tokenId'])
export class TokenHolding {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    userAddress: string;

    @Column()
    tokenId: number;
}