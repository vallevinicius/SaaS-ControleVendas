import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtPayload } from './types/authenticated-user.type';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Nunca permitir auto-registro como ADMIN: esse role só é atribuído
    // manualmente (seed ou por outro admin já autenticado), nunca por
    // payload de cliente não confiável — mitigação direta de privilege escalation.
    const requestedRole = dto.role === UserRole.ADMIN ? UserRole.CANDIDATE : dto.role;

    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('E-mail já cadastrado.');
    }

    // argon2id: escolha deliberada sobre bcrypt. Resistente a ataques de
    // hardware (GPU/ASIC) por ser memory-hard, e é a recomendação atual da
    // OWASP para hashing de senha — bcrypt seria a alternativa "de sempre",
    // mas perde em resistência a ataques paralelos em GPU.
    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: requestedRole,
      },
    });

    return this.issueTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    // Mensagem de erro genérica e idêntica para "usuário não existe" e "senha
    // errada". Diferenciar essas duas respostas permite enumeração de contas
    // (user enumeration) — falha comum e fácil de evitar.
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async refresh(userId: string, refreshToken: string): Promise<AuthResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Sessão inválida.');
    }

    // O refresh token nunca é guardado em texto puro — apenas seu hash.
    // Isso limita o dano de um vazamento de banco de dados: o hash sozinho
    // não permite forjar uma sessão.
    const matches = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!matches) {
      throw new UnauthorizedException('Sessão inválida.');
    }

    return this.issueTokens(user.id, user.email, user.role);
  }

  async logout(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: null },
    });
  }

  private async issueTokens(
    userId: string,
    email: string,
    role: UserRole,
  ): Promise<AuthResponseDto> {
    const payload: JwtPayload = { sub: userId, email, role };

    const accessExpiresIn = this.configService.get<string>('jwt.accessExpiresIn');
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn');

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.accessSecret'),
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('jwt.refreshSecret'),
        expiresIn: refreshExpiresIn,
      }),
    ]);

    const refreshTokenHash = await argon2.hash(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600,
    };
  }
}
