export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Recurso não encontrado') {
    super(404, message)
    this.name = 'NotFoundError'
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflito de dados') {
    super(409, message)
    this.name = 'ConflictError'
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Dados inválidos') {
    super(400, message)
    this.name = 'ValidationError'
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Não autorizado') {
    super(401, message)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Permissão insuficiente') {
    super(403, message)
    this.name = 'ForbiddenError'
  }
}
