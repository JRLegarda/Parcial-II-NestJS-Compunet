import { Program } from "src/program/entities/program.entity";
import { BeforeInsert, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id:string;

    @Column({
        type: "text",
        unique: true
    })
    email:string;

    @Column({
        type: "text"
    })
    password?:string;

    @Column({
        type: "text",
    })
    fullName:string;

    @Column("bool", {default: true})
    isActive: boolean;

    @Column({
        type: "text",
        array: true,
        default: ["teacher"]
    })
    roles: string[];

    @OneToMany(
        () => Program,
        (program) => program.createdBy,
    )
    programs?: Program[];

    @BeforeInsert()
    @BeforeUpdate()
    checkEmailBeforeChanges(){
        this.email = this.email.toLowerCase().trim();
    }
}
