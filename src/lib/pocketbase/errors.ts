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

  // Tratamento específico de status HTTP e mensagens padrão do PocketBase
  if (error.status === 401) {
    return 'Sessão expirada ou não autenticada. Por favor, faça login novamente.'
  }
  if (error.status === 403) {
    return 'Acesso negado: apenas o Super Usuário possui permissão para esta operação.'
  }
  if (error.status === 404) {
    return 'Registro ou recurso não encontrado no servidor, ou acesso não autorizado.'
  }
  if (error.status === 400) {
    const fieldErrors = extractFieldErrors(error)
    const msgs = Object.entries(fieldErrors).map(([campo, msg]) => {
      let nomeAmigavel = campo
      if (campo === 'email') nomeAmigavel = 'E-mail'
      else if (campo === 'name') nomeAmigavel = 'Nome'
      else if (campo === 'password') nomeAmigavel = 'Senha'
      else if (campo === 'perfil') nomeAmigavel = 'Perfil'
      else if (campo === 'tema_preferido') nomeAmigavel = 'Tema preferido'
      return `${nomeAmigavel}: ${msg}`
    })
    if (msgs.length > 0) {
      return `Erro nos campos: ${msgs.join(', ')}`
    }
  }

  const msgs = Object.values(extractFieldErrors(error))
  if (msgs.length > 0) return msgs.join(' ')

  const raw = error.message || ''
  if (raw.includes("The requested resource wasn't found")) {
    return 'Registro não encontrado ou permissão de acesso insuficiente.'
  }
  if (raw.includes('Failed to authenticate') || raw.includes('Failed to create record')) {
    return 'Falha na autenticação ou permissão insuficiente.'
  }

  return raw || 'Ocorreu um erro ao comunicar com o servidor.'
}
