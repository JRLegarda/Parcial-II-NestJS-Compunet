import { ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Program } from './entities/program.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateProgramDto } from './dto/create-program.dto';
import { PaginationDto } from './dto/pagination.dto';
import { isUUID } from 'class-validator';
import { AssignStudentsDto } from './dto/assign-students.dto';

@Injectable()
export class ProgramService {

    // TODO Reto 1: inyecta el repositorio de Program (y lo que necesites para las transacciones)
    private readonly logger = new Logger("ProgramService");
    
    constructor(
        @InjectRepository(Program)
        private readonly programRepository: Repository<Program>,
        private datasource: DataSource
    ){}

    // TODO Reto 1: create(createProgramDto, user) -> guarda el programa
    //   - nombre o código repetido -> 409 Conflict (no 500)
    async create(createProgramDto: CreateProgramDto): Promise<Program> {
        try {
            const program = this.programRepository.create({
                ...createProgramDto,
            });
            await this.programRepository.save(program);
            return program;
        } catch (error) {
            this.handleException(error);
        }
    }

    // TODO Reto 1: findAll(paginationDto) -> lista paginada (limit / skip)
    async findAll(paginationDto: PaginationDto){
        try{
            const {skip, limit} = paginationDto;
            return await this.programRepository.find({
                take: limit,
                skip: skip
            });
        }catch(error){
            this.handleException(error);
        }
    }

    // TODO Reto 2: findOne(id) -> programa con sus estudiantes, 404 si no existe
    async findOne(term: string) {
        let program: Program | null;
        try {
            if (isUUID(term)) {
                program = await this.programRepository.findOne({
                    where: { id: term },
                    relations: { students: true },
                });
            } else {
                program = await this.programRepository
                    .createQueryBuilder('program')
                    .leftJoinAndSelect('program.students', 'students')
                    .where('UPPER(program.name) = :name', { name: term.toUpperCase() })
                    .getOne();
            }

            if (!program) {
                throw new NotFoundException(`Program with ${term} not found`);
            }

            return program;
        } catch (error) {
            this.handleException(error);
        }
    }

    // TODO Reto 2: assignStudents(id, assignStudentsDto) -> AGREGA estudiantes al programa
    //   dentro de una transacción (QueryRunner), conservando los que ya tenía.
    //   Mismo patrón del update de estudiantes corregido en clase (combinar las notas):
    //   traer los actuales -> combinar con los nuevos -> guardar la lista completa.
    //   Si algún id no existe: 404 y rollback.
    async assignStudents(id: string, assignStudentsDto : AssignStudentsDto){
        const {grades, ...studentDetails } = updateStudentDto;

        const student = await this.studentRepository.preload({
            id,
            ...studentDetails
        })

        if(!student) throw new NotFoundException("Student with id ${id} not found");

        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try{
            if(grades){
            //1. Traer las notas que el estudiante tiene hoy
                const currentGrades= await queryRunner.manager.find(Grades, {
                    where: {student : {id}}
                }
                )

                // 2. combinar: actualizar las notas que existen, agregar las nuevas si llegan nuevas
                for (const newGrade of grades){
                    const existing = currentGrades.find(
                        grade => grade.subject.toLowerCase() === newGrade.subject.toLowerCase()
                    );

                    if(existing) {
                        existing.grade = newGrade.grade
                    }else{
                        currentGrades.push(this.gradesRepository.create({
                            subject: newGrade.subject,
                            grade: newGrade.grade
                        }))
                    }


                }

                //3 guardar la lista de notas completas, no queda niguna nota huerfana
                student.grades = currentGrades;

            }

            await queryRunner.manager.save(student);
            await queryRunner.commitTransaction();
            await queryRunner.release();

            return await this.findOne(student.id);

        }catch(error){
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            this.handleException(error);
        }
    }

    // TODO Reto 3: bulkCreate(bulkCreateProgramDto, user) -> crea todos los programas o ninguno
    //   (transacción). Cualquier nombre/código repetido -> 409 y rollback.

    private handleException(error: any): never {
        if (error instanceof HttpException) throw error;
        if (error.code === '23505') {
            throw new ConflictException(error.detail);
        }
        this.logger.error(error);
        throw new InternalServerErrorException('Unexpected error, check server logs');
    }
}
