// TODO Reto 1: convierte esta clase en una entidad de TypeORM (tabla "program") con:
//   - id: UUID generado automáticamente
//   - name: text, único
//   - code: text, único
//   - credits: int
// TODO Reto 2: relación 1:N con Student -> propiedad `students?: Student[]`
// TODO Reto 4: relación N:1 con User -> propiedad `createdBy?: User` (el admin que lo creó)
//
// Usa imports relativos (ej. "../../student/entities/student.entity"), no "src/...":

import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

// Jest no resuelve el alias "src/" y el test de Student dejaría de correr.
@Entity()
export class Program {

    @PrimaryGeneratedColumn("uuid")
    id:string | undefined;

    @Column({
        type: "text",
        unique: true
    })
    name:string | undefined;

    @Column({
        type: "text",
        unique: true
    })
    code:string | undefined;

    @Column("int")
    credits:number | undefined;



}
