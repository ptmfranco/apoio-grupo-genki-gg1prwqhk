export interface FaixaEtariaOption {
  id: string
  label: string
}

export const FAIXAS_ETARIAS: readonly FaixaEtariaOption[] = [
  { id: '01', label: '0 a 18 anos' },
  { id: '02', label: '19 a 23 anos' },
  { id: '03', label: '24 a 28 anos' },
  { id: '04', label: '29 a 33 anos' },
  { id: '05', label: '34 a 38 anos' },
  { id: '06', label: '39 a 43 anos' },
  { id: '07', label: '44 a 48 anos' },
  { id: '08', label: '49 a 53 anos' },
  { id: '09', label: '54 a 58 anos' },
  { id: '10', label: '59 anos ou mais' },
] as const

export const FAIXA_PADRAO = '05' // 34 a 38 anos

export const FAIXA_VALUES = FAIXAS_ETARIAS.map((f) => f.id)

/**
 * Retorna o rótulo amigável da faixa etária a partir do ID ou de um valor legado.
 * Se já for o rótulo ou se for um ID (ex: "01"), formata adequadamente.
 */
export function getFaixaLabel(value?: string | null): string {
  if (!value) return 'Não informada'

  const trimmed = value.trim()

  // Procura por ID direto ("01", "02", ...) ou "1", "2"
  const byId = FAIXAS_ETARIAS.find(
    (f) => f.id === trimmed || parseInt(f.id, 10).toString() === trimmed,
  )
  if (byId) return byId.label

  // Procura por rótulo exato (case-insensitive)
  const byLabel = FAIXAS_ETARIAS.find((f) => f.label.toLowerCase() === trimmed.toLowerCase())
  if (byLabel) return byLabel.label

  // Mapeamentos de valores legados conhecidos ('18-24', '35-39', '60+', etc.)
  const normalized = trimmed.replace(/\s+/g, '').replace('anos', '')
  if (
    normalized === '0-18' ||
    normalized === '10-14' ||
    normalized === '14-17' ||
    normalized === '0a18'
  ) {
    return '0 a 18 anos'
  }
  if (
    normalized === '19-23' ||
    normalized === '18-24' ||
    normalized === '18-25' ||
    normalized === '20-24'
  ) {
    return '19 a 23 anos'
  }
  if (normalized === '24-28' || normalized === '26-35') {
    return '24 a 28 anos'
  }
  if (normalized === '29-33' || normalized === '30-34' || normalized === '18-29') {
    return '29 a 33 anos'
  }
  if (normalized === '34-38' || normalized === '35-39' || normalized === '30-39') {
    return '34 a 38 anos'
  }
  if (normalized === '39-43' || normalized === '40-44') {
    return '39 a 43 anos'
  }
  if (
    normalized === '44-48' ||
    normalized === '45-49' ||
    normalized === '48-52' ||
    normalized === '40-49'
  ) {
    return '44 a 48 anos'
  }
  if (normalized === '49-53' || normalized === '50-54' || normalized === '52-56') {
    return '49 a 53 anos'
  }
  if (
    normalized === '54-58' ||
    normalized === '55-59' ||
    normalized === '58-62' ||
    normalized === '50-59'
  ) {
    return '54 a 58 anos'
  }
  if (
    normalized === '59+' ||
    normalized === '60+' ||
    normalized === '60-64' ||
    normalized === '59anosoumais'
  ) {
    return '59 anos ou mais'
  }

  return trimmed
}

/**
 * Normaliza qualquer entrada (ID, rótulo ou valor legado) para o ID canônico ('01' a '10').
 */
export function normalizeFaixaId(value?: string | null): string {
  if (!value) return FAIXA_PADRAO

  const trimmed = value.trim()
  const byId = FAIXAS_ETARIAS.find(
    (f) => f.id === trimmed || parseInt(f.id, 10).toString() === trimmed,
  )
  if (byId) return byId.id

  const label = getFaixaLabel(trimmed)
  const byLabel = FAIXAS_ETARIAS.find((f) => f.label === label)
  return byLabel ? byLabel.id : FAIXA_PADRAO
}
