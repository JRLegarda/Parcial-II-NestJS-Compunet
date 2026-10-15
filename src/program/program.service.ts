import { BadRequestException, ConflictException, HttpException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Program } from './entities/program.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateProgramDto } from './dto/create-program.dto';
import { PaginationDto } from './dto/pagination.dto';
import { isUUID } from 'class-validator';
import { AssignStudentsDto } from './dto/assign-students.dto';
import { Student } from '../student/entities/student.entity';
import { BulkCreateProgramDto } from './dto/bulk-create-program.dto';
import { User } from '../user/entities/user.entity';

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
    async create(createProgramDto: CreateProgramDto, user: User): Promise<Program> {
        try {
            const program = this.programRepository.create({
                ...createProgramDto,
            });
            program.createdBy = user;
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
    async findOne(id: string) {
        if (!isUUID(id)) {
            throw new BadRequestException(`id ${id} is not a valid UUID`);
        }

        const program = await this.programRepository.findOne({
            where: { id },
            relations: { students: true },
        });

        if (!program) {
            throw new NotFoundException(`Program with id ${id} not found`);
        }

        return program;
    }

    // TODO Reto 2: assignStudents(id, assignStudentsDto) -> AGREGA estudiantes al programa
    //   dentro de una transacción (QueryRunner), conservando los que ya tenía.
    //   Mismo patrón del update de estudiantes corregido en clase (combinar las notas):
    //   traer los actuales -> combinar con los nuevos -> guardar la lista completa.
    //   Si algún id no existe: 404 y rollback.
    async assignStudents(id: string, assignStudentsDto: AssignStudentsDto) {
        const { studentIds } = assignStudentsDto;

        const program = await this.programRepository.preload({ id });
        if (!program) throw new NotFoundException(`Program with id ${id} not found`);

        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Traer los estudiantes que el programa tiene hoy
            const currentStudents = await queryRunner.manager.find(Student, {
                where: { program: { id } },
            });

            // 2. Combinar: agregar solo los nuevos (los que ya están no se repiten)
            for (const studentId of studentIds) {
                const existing = currentStudents.find(
                    (student) => student.id === studentId,
                );

                if (!existing) {
                    const student = await queryRunner.manager.findOneBy(Student, {
                        id: studentId,
                    });
                    if (!student) {
                        throw new NotFoundException(`Student with id ${studentId} not found`);
                    }
                    currentStudents.push(student);
                }
            }

            // 3. Guardar la lista completa: no queda ningún estudiante huérfano
            program.students = currentStudents;

            await queryRunner.manager.save(program);
            await queryRunner.commitTransaction();
            await queryRunner.release();

            return await this.findOne(program.id);
        } catch (error) {
            await queryRunner.rollbackTransaction();
            await queryRunner.release();
            this.handleException(error);
        }
    }

    // TODO Reto 3: bulkCreate(bulkCreateProgramDto, user) -> crea todos los programas o ninguno
    //   (transacción). Cualquier nombre/código repetido -> 409 y rollback.
    async createMany(bulkCreateProgramDto: BulkCreateProgramDto, user:User): Promise<Program[]> {
        const queryRunner = this.datasource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            const programs = bulkCreateProgramDto.programs.map((dto) =>
                this.programRepository.create({ ...dto, createdBy: user }),
            );
            await queryRunner.manager.save(programs);
            await queryRunner.commitTransaction();
            return programs;
        } catch (error) {
            await queryRunner.rollbackTransaction();
            this.handleException(error);
        } finally {
            await queryRunner.release();
        }
    }

    private handleException(error: any): never {
        if (error instanceof HttpException) throw error;
        if (error.code === '23505') {
            throw new ConflictException(error.detail);
        }
        this.logger.error(error);
        throw new InternalServerErrorException('Unexpected error, check server logs');
    }
}
