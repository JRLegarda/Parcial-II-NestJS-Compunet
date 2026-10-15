import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProgramService } from './program.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { PaginationDto } from './dto/pagination.dto';

@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // TODO Reto 1: POST   /api/program               -> crear programa
  @Post()
  create(@Body() createProgramDto: CreateProgramDto) {
    return this.programService.create(createProgramDto);
  }
  // TODO Reto 1: GET    /api/program               -> listar (paginado con PaginationDto)
  @Get()
  findAll(@Query() paginationDto: PaginationDto){
    return this.programService.findAll(paginationDto);
  }
  // TODO Reto 2: GET    /api/program/:id           -> programa con sus estudiantes
  @Get(":term")
  findOne(@Param("term") term:string){
    return this.programService.findOne(term);
  }
  // TODO Reto 2: PATCH  /api/program/:id/students  -> agregar estudiantes (acumulativo)
  // TODO Reto 3: POST   /api/program/bulk          -> crear programas en lote (todo o nada)
  // TODO Reto 4: proteger los POST y el PATCH para que solo un admin pueda usarlos
}
