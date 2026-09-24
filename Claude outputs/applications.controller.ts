import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationStatusDto } from './dto/update-application-status.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('applications')
@ApiBearerAuth('access-token')
@Controller({ path: 'applications', version: '1' })
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Candidata-se a uma vaga aberta.' })
  apply(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.apply(user, dto);
  }

  @Get('me')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Lista as candidaturas do candidato autenticado.' })
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.applicationsService.findMineAsCandidate(user);
  }

  @Get('job/:jobId')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Lista candidaturas recebidas em uma vaga (dono da vaga ou admin).' })
  findForJob(@CurrentUser() user: AuthenticatedUser, @Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.applicationsService.findForJob(user, jobId);
  }

  @Patch(':id/status')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Empresa avalia uma candidatura (aprova/rejeita/etc).' })
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationStatusDto,
  ) {
    return this.applicationsService.updateStatus(user, id, dto.status, dto.companyNotes);
  }

  @Patch(':id/withdraw')
  @Roles(UserRole.CANDIDATE)
  @ApiOperation({ summary: 'Candidato retira a própria candidatura.' })
  withdraw(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.applicationsService.withdraw(user, id);
  }
}
