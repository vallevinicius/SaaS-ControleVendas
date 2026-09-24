import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

// Filtro global: qualquer exceção não tratada explicitamente cai aqui.
// Objetivo central: NUNCA vazar detalhes internos (stack trace, mensagem de
// erro do driver MySQL, nome de constraint, path de arquivo) para o cliente.
// Isso é superfície de reconhecimento gratuita para um atacante.
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno do servidor.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message = typeof body === 'string' ? body : (body as any).message ?? message;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Traduz erros conhecidos do Prisma em respostas HTTP seguras,
      // sem expor código de erro do driver nem nome de tabela/coluna.
      switch (exception.code) {
        case 'P2002': // unique constraint violation
          status = HttpStatus.CONFLICT;
          message = 'Já existe um registro com esses dados.';
          break;
        case 'P2025': // record not found
          status = HttpStatus.NOT_FOUND;
          message = 'Registro não encontrado.';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          message = 'Não foi possível processar a requisição.';
      }
    }

    // Log completo apenas no servidor (observabilidade interna).
    this.logger.error(
      `${request.method} ${request.url} -> ${status}: ${
        exception instanceof Error ? exception.message : 'unknown error'
      }`,
      exception instanceof Error ? exception.stack : undefined,
    );

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
