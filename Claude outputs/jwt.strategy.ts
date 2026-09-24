import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../database/prisma.service';
import { JwtPayload, AuthenticatedUser } from '../types/authenticated-user.type';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.accessSecret');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  // Reconsulta o usuário a cada requisição (em vez de confiar cegamente no
  // payload do token). Custo: uma query a mais por request. Benefício: um
  // usuário desativado (isActive=false) ou deletado é bloqueado imediatamente,
  // sem esperar o token expirar — mitigação relevante contra contas
  // comprometidas ou ex-funcionários de empresas.
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Usuário inválido ou inativo.');
    }

    return { id: user.id, email: user.email, role: user.role };
  }
}
