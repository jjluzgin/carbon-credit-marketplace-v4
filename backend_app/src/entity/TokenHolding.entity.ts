import { Entity, PrimaryGeneratedColumn, Column, Unique } from 'typeorm';

@Entity({name: "tokenHolding"})
@Unique(['userAddress', 'tokenId'])
export class TokenHolding {
    @PrimaryGeneratedColumn("uuid")
    id: number;

    @Column({nullable: false})
    userAddress: string;

    @Column({nullable: false})
    tokenId: number;
}