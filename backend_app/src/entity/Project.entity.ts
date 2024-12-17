import { Entity, PrimaryGeneratedColumn, Column, Unique, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { ProjectStatus } from "../constants"

@Entity({name: "projects"})
@Unique(["projectId"])
export class Project {

    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column({nullable: false})
    projectId: number
    
    @Column({nullable: false})
    owner: string

    @Column({default: ""})
    auditor: string

    @Column({nullable: false})
    verificationId: string

    @Column({nullable: false})
    ipfsCID: string

    @Column()
    carbonRemoved: number

    @Column({default: 0})
    creditsIssued: number

    @Column({type: "int", default: ProjectStatus.Pending})
    status: number

    @Column()
    authenticationDate: Date

    @CreateDateColumn()
    createdAt: Date;
    
    @UpdateDateColumn()
    updatedAt: Date;
}
