import { ClientResponseError } from 'pocketbase'

export type FieldErrors = Record<string, string>

export function extractFieldErrors(error: unknown): FieldErrors {
  if (!(error instanceof ClientResponseError)) return {}
  const data = error.response?.data
  if (!data || typeof data !== 'object') return {}
  const errors: FieldErrors = {}
  for (const [field, detail] of Object.entries(data)) {
    if (
      detail &&
      typeof detail === 'object' &&
      'message' in detail &&
      typeof (detail as { message: unknown }).message === 'string'
    ) {
      errors[field] = (detail as { message: string }).message
    }
  }
  return errors
}

export function getErrorMessage(error: unknown): string {
  if (!(error instanceof ClientResponseError)) {
    return error instanceof Error ? error.message : 'Ocorreu um erro inesperado.'
  }

  const status = error.status || error.response?.status
  if (status === 401) {
    return 'Sua sessão expirou. Faça login novamente.'
  }
  if (status === 403) {
    return 'Acesso negado. Apenas o Super Usuário tem permissão para esta ação.'
  }
  if (status === 404) {
    return 'Registro não encontrado.'
  }
  if (status === 409) {
    return 'Conflito de dados: este e-mail já está sendo utilizado por outro usuário.'
  }

  const fieldErrors = extractFieldErrors(error)
  const entries = Object.entries(fieldErrors)
  if (entries.length > 0) {
    const formatted = entries.map(([field, rawMsg]) => {
      let msg = rawMsg
      if (msg.includes("Values don't match") || msg.includes('do not match')) {
        msg = 'Os valores não conferem.'
      } else if (msg.includes('Cannot be blank')) {
        msg = 'Campo obrigatório.'
      } else if (msg.includes('must be at least')) {
        msg = 'Tamanho mínimo não atingido.'
      }

      if (field === 'email') return `E-mail: ${msg}`
      if (field === 'oldPassword') return `Senha atual: ${msg}`
      if (field === 'password') return `Nova senha: ${msg}`
      if (field === 'passwordConfirm') return `Confirmação de senha: ${msg}`
      return `${field}: ${msg}`
    })
    return `Erro nos campos: ${formatted.join(', ')}`
  }

  if (error.response?.message) {
    return error.response.message
  }

  return error.message || 'Ocorreu um erro inesperado.'
}
