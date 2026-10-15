import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { CreateProgramDto } from './create-program.dto';

/** Body para POST /api/club/bulk — crear varios clubes de una vez */
export class CreateProgramsDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateProgramDto)
  programs: CreateClubDto[];
}
