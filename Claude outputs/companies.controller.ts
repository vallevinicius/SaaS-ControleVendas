import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CompaniesService } from './companies.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('companies')
@ApiBearerAuth('access-token')
@Controller({ path: 'companies', version: '1' })
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @Roles(UserRole.COMPANY)
  @ApiOperation({ summary: 'Cria o perfil de empresa vinculado ao usuário autenticado.' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCompanyDto) {
    return this.companiesService.createProfile(user, dto);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Exibe o perfil público de uma empresa.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.COMPANY, UserRole.ADMIN)
  @ApiOperation({ summary: 'Atualiza dados da empresa (dona do perfil ou admin).' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(user, id, dto);
  }

  @Patch(':id/verify')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Verifica/aprova uma empresa (exclusivo da Prefeitura).' })
  verify(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.verify(user, id);
  }
}
