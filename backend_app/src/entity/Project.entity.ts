import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { ProjectStatus } from "../constants"

@Entity({name: "projects"})
export class Project {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({nullable: false, unique: true})
    projectId: number
    
    @Column({nullable: false})
    owner: string

    @Column({default: ""})
    auditor: string

    @Column({nullable: false, unique: true})
    verificationId: string

    @Column({nullable: false})
    ipfsCID: string

    @Column()
    carbonRemoved: number

    @Column({default: 0})
    creditsIssued: number

    @Column({type: "int", default: ProjectStatus.Pending})
    status: number

    @Column({default: 0})
    authenticationDate: number

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
}
