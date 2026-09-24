import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'candidato@email.com' })
  @IsEmail()
  email: string;

  // Política mínima de senha aplicada no DTO. Reforço adicional (hashing com
  // argon2id + salt) acontece no service — nunca confiar apenas na validação
  // de entrada como camada de segurança de senha.
  @ApiProperty({ example: 'Senha@Forte123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'A senha deve ter no mínimo 8 caracteres.' })
  password: string;

  // Nunca aceitar role=ADMIN nesse endpoint público — ver AuthService.register,
  // que ignora explicitamente valores não permitidos vindos do client.
  @ApiProperty({ enum: UserRole, example: UserRole.CANDIDATE })
  @IsEnum(UserRole)
  role: UserRole;
}
