// TODO Reto 1: reglas de validación con class-validator
//   - name: string, mínimo 3 caracteres
//   - code: string de 3 a 6 letras MAYÚSCULAS (ej. "SIS", "MED")

import { Type } from "class-transformer";
import { IsInt, IsPositive, IsString, Matches, MaxLength, MinLength } from "class-validator";

//   - credits: entero positivo
export class CreateProgramDto {

    @IsString()
    @MinLength(3)
    name: string;

    @IsString()
    @MinLength(3)
    @MaxLength(6)
    @Matches(/^[A-Z]{3,6}$/)
    code: string;

    @Type(() => Number)
    @IsInt()
    @IsPositive()
    credits: number;


}
