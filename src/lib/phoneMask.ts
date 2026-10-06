/**
 * Utilitários para máscara e validação estrita de telefone/WhatsApp (11 dígitos: DDD + celular).
 * Formato padrão: (99) 9999-99999 (ou (99) 99999-9999 conforme uso usual no Brasil).
 * Padrão solicitado especificamente pelo usuário: "(99) 9999-99999" (DDD + celular, 11 dígitos).
 */

/**
 * Remove qualquer caractere que não seja número
 */
export function onlyDigits(val?: string | null): string {
  if (!val) return ''
  return val.replace(/\D/g, '')
}

/**
 * Aplica máscara de telefone/WhatsApp.
 * Aceita até 11 dígitos no formato: (99) 9999-99999
 * Permite digitação progressiva.
 */
export function formatPhone(val?: string | null): string {
  const digits = onlyDigits(val).slice(0, 11)
  if (!digits) return ''

  if (digits.length <= 2) {
    return `(${digits}`
  }
  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
}

/**
 * Validação estrita: exatamente 11 dígitos numéricos
 */
export function isValidPhone11(val?: string | null): boolean {
  const digits = onlyDigits(val)
  return digits.length === 11
}

/**
 * Retorna mensagem de erro em português se for inválido ou vazio
 */
export function validatePhoneField(
  val?: string | null,
  fieldName = 'Telefone',
): { valid: boolean; error?: string } {
  const digits = onlyDigits(val)
  if (!digits) {
    return { valid: false, error: `${fieldName} é obrigatório.` }
  }
  if (digits.length !== 11) {
    return {
      valid: false,
      error: `${fieldName} deve conter exatamente 11 dígitos (DDD + celular). Ex: (11) 9876-54321`,
    }
  }
  return { valid: true }
}
