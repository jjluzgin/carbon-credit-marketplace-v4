import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity({name: "sellOrder"})
export class SellOrder {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({nullable: false, unique: true})
    orderId: number

    @Column({nullable: false})
    seller: string
    
    @Column({nullable: false})
    projectId: number

    @Column({nullable: false})
    creditsAmount: number

    @Column({nullable: false})
    totalPrice: number

    @Column({nullable: false})
    expirationDate: number

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
}
