import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../auth/types/authenticated-user.type';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Retorna os dados do usuário autenticado.' })
  me(@CurrentUser() user: AuthenticatedUser) {
    // Endpoint só acessa o PRÓPRIO recurso (id vem do token, nunca de param
    // de URL) — elimina por design a possibilidade de IDOR neste endpoint.
    return this.usersService.findById(user.id);
  }
}
