import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'candidato@email.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@Forte123' })
  @IsString()
  password: string;
}
