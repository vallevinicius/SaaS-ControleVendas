import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { QueryJobsDto } from './dto/query-jobs.dto';
import { JobResponseDto } from './dto/job-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('jobs')
@ApiBearerAuth('access-token')
@Controller({ path: 'jobs', version: '1' })
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Cria uma nova vaga (empresa verificada, status inicial DRAFT).' })
  @ApiResponse({ status: 201, type: JobResponseDto })
  @ApiResponse({ status: 403, description: 'Empresa não verificada pela Prefeitura.' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJobDto) {
    return this.jobsService.create(user, dto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lista vagas com filtros e paginação (público vê apenas OPEN).' })
  @ApiResponse({ status: 200, description: 'Lista paginada de vagas.' })
  findAll(@CurrentUser() user: AuthenticatedUser | undefined, @Query() query: QueryJobsDto) {
    return this.jobsService.findAll(user, query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Detalha uma vaga pelo id.' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  @ApiResponse({ status: 404, description: 'Vaga não encontrada.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza os dados de uma vaga (apenas a empresa dona ou admin).' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  @ApiResponse({ status: 403, description: 'Vaga pertence a outra empresa.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobDto,
  ) {
    return this.jobsService.update(user, id, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Altera o status da vaga (ex: publicar, pausar, encerrar).' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateJobStatusDto,
  ) {
    return this.jobsService.updateStatus(user, id, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Encerra uma vaga (soft delete via status CLOSED).' })
  @ApiResponse({ status: 200, type: JobResponseDto })
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.jobsService.remove(user, id);
  }
}
