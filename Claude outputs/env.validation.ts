import { plainToInstance } from 'class-transformer';
import { IsEnum, IsInt, IsString, MinLength, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

// Validação estrita das env vars no boot. Não é opcional: um JWT_SECRET curto
// ou ausente em produção é uma falha de segurança silenciosa até alguém
// forjar um token — melhor derrubar a aplicação no start do que descobrir isso
// em produção.
class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

  @IsInt()
  PORT: number;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @MinLength(32, { message: 'JWT_SECRET deve ter no mínimo 32 caracteres' })
  JWT_SECRET: string;

  @IsString()
  @MinLength(32, { message: 'JWT_REFRESH_SECRET deve ter no mínimo 32 caracteres' })
  JWT_REFRESH_SECRET: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    throw new Error(`Configuração de ambiente inválida: ${errors.toString()}`);
  }
  return validatedConfig;
}
