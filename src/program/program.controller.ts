import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ProgramService } from './program.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { PaginationDto } from './dto/pagination.dto';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { BulkCreateProgramDto } from './dto/bulk-create-program.dto';
import { Auth } from '../user/decorators/auth.decorator';
import { ValidRoles } from '../user/enums/valid-roles.enum';
import { GetUser } from '../user/decorators/get-user.decorator';
import { User } from '../user/entities/user.entity';

@Controller('program')
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // TODO Reto 1: POST   /api/program               -> crear programa
  // TODO Reto 4: solo admin; createdBy desde @GetUser()
  @Post()
  @Auth(ValidRoles.admin)
  create(@Body() createProgramDto: CreateProgramDto, @GetUser() user: User) {
    return this.programService.create(createProgramDto, user);
  }

  // TODO Reto 3: POST   /api/program/bulk          -> crear programas en lote (todo o nada)
  // TODO Reto 4: solo admin; createdBy desde @GetUser()
  @Post('bulk')
  @Auth(ValidRoles.admin)
  createMany(@Body() bulkCreateProgramDto: BulkCreateProgramDto, @GetUser() user: User) {
    return this.programService.createMany(bulkCreateProgramDto, user);
  }

  // TODO Reto 1: GET    /api/program               -> listar (paginado con PaginationDto)
  @Get()
  findAll(@Query() paginationDto: PaginationDto){
    return this.programService.findAll(paginationDto);
  }

  // TODO Reto 2: GET    /api/program/:id           -> programa con sus estudiantes
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.programService.findOne(id);
  }

  // TODO Reto 2: PATCH  /api/program/:id/students  -> agregar estudiantes (acumulativo)
  // TODO Reto 4: solo admin
  @Patch(':id/students')
  @Auth(ValidRoles.admin)
  assignStudents(@Param('id') id: string, @Body() assignStudentsDto: AssignStudentsDto) {
    return this.programService.assignStudents(id, assignStudentsDto);
  }
}
