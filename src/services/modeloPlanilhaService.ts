import * as XLSX from 'xlsx'
import { FAIXAS_ETARIAS } from '@/constants/faixasEtarias'

/**
 * Interface representando uma linha da planilha modelo de importação de beneficiários.
 * Os nomes das propriedades correspondem exatamente aos cabeçalhos aceitos/reconhecidos
 * pelo importador de lotes.
 */
export interface ModeloBeneficiarioRow {
  matricula: string
  nome: string
  vinculo: 'TITULAR' | 'DEPENDENTE'
  unidade: string
  faixa_etaria: string
  telefone: string
  celular: string
  condicao_principal: string
  risco: 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
  custo_12m: number
  email?: string
}

/**
 * 10 registros de exemplo realistas e 100% coerentes com as regras do sistema:
 * - Matrículas no padrão MAT-000001 ... MAT-000010
 * - Vínculos alternando TITULAR e DEPENDENTE
 * - Faixas etárias cobrindo os 10 valores padronizados de 01 a 10 ("0 a 18 anos" até "59 anos ou mais")
 * - Telefones e Celulares válidos com exatamente 11 dígitos no formato "(99) 9999-99999" (ou "(99) 98888-7777")
 * - Condições principais com códigos e termos oficiais (CID-10 e protocolos clínicos)
 * - Riscos válidos (BAIXO, MEDIO, ALTO, CRITICO)
 * - Custos de sinistralidade plausíveis (12 meses)
 */
export const DADOS_EXEMPLO_MODELO: ModeloBeneficiarioRow[] = [
  {
    matricula: 'MAT-000001',
    nome: 'Carlos Eduardo Menezes',
    vinculo: 'TITULAR',
    unidade: 'São Paulo - Matriz',
    faixa_etaria: FAIXAS_ETARIAS[4].label, // "34 a 38 anos"
    telefone: '(11) 98111-2233',
    celular: '(11) 98111-2233',
    condicao_principal: 'I10 — Hipertensão Arterial Sistêmica',
    risco: 'ALTO',
    custo_12m: 14850.0,
    email: 'carlos.menezes@grupogenki.com.br',
  },
  {
    matricula: 'MAT-000002',
    nome: 'Mariana Duarte Menezes',
    vinculo: 'DEPENDENTE',
    unidade: 'São Paulo - Matriz',
    faixa_etaria: FAIXAS_ETARIAS[0].label, // "0 a 18 anos"
    telefone: '(11) 98222-3344',
    celular: '(11) 98222-3344',
    condicao_principal: 'J45 - ASMA',
    risco: 'MEDIO',
    custo_12m: 3420.0,
    email: 'mariana.menezes@exemplo.com.br',
  },
  {
    matricula: 'MAT-000003',
    nome: 'Roberto Silveira Santos',
    vinculo: 'TITULAR',
    unidade: 'Curitiba - Filial',
    faixa_etaria: FAIXAS_ETARIAS[7].label, // "49 a 53 anos"
    telefone: '(41) 98777-6655',
    celular: '(41) 98777-6655',
    condicao_principal: 'E10 - DIABETES MELLITUS INSULINO-DEPENDENTE',
    risco: 'CRITICO',
    custo_12m: 28400.0,
    email: 'roberto.santos@grupogenki.com.br',
  },
  {
    matricula: 'MAT-000004',
    nome: 'Beatriz Almeida Silveira',
    vinculo: 'DEPENDENTE',
    unidade: 'Curitiba - Filial',
    faixa_etaria: FAIXAS_ETARIAS[1].label, // "19 a 23 anos"
    telefone: '(41) 98444-5566',
    celular: '(41) 98444-5566',
    condicao_principal: 'Transtorno de Ansiedade',
    risco: 'BAIXO',
    custo_12m: 1850.0,
    email: 'beatriz.silveira@exemplo.com.br',
  },
  {
    matricula: 'MAT-000005',
    nome: 'Fernando Guimarães Lima',
    vinculo: 'TITULAR',
    unidade: 'Campinas - Operações',
    faixa_etaria: FAIXAS_ETARIAS[5].label, // "39 a 43 anos"
    telefone: '(19) 98888-7777',
    celular: '(19) 98888-7777',
    condicao_principal: 'M54 - DORSALGIA',
    risco: 'MEDIO',
    custo_12m: 7600.0,
    email: 'fernando.lima@grupogenki.com.br',
  },
  {
    matricula: 'MAT-000006',
    nome: 'Juliana Costa Ferreira',
    vinculo: 'DEPENDENTE',
    unidade: 'Campinas - Operações',
    faixa_etaria: FAIXAS_ETARIAS[2].label, // "24 a 28 anos"
    telefone: '(19) 99123-4567',
    celular: '(19) 99123-4567',
    condicao_principal: 'Gestação de Alto Risco',
    risco: 'ALTO',
    custo_12m: 16900.0,
    email: 'juliana.costa@exemplo.com.br',
  },
  {
    matricula: 'MAT-000007',
    nome: 'Antônio Marcos Pires',
    vinculo: 'TITULAR',
    unidade: 'Rio de Janeiro - Regional',
    faixa_etaria: FAIXAS_ETARIAS[9].label, // "59 anos ou mais"
    telefone: '(21) 98654-3210',
    celular: '(21) 98654-3210',
    condicao_principal: 'I50 - INSUFICIÊNCIA CARDÍACA',
    risco: 'CRITICO',
    custo_12m: 32500.0,
    email: 'antonio.pires@grupogenki.com.br',
  },
  {
    matricula: 'MAT-000008',
    nome: 'Camila Rocha Pires',
    vinculo: 'DEPENDENTE',
    unidade: 'Rio de Janeiro - Regional',
    faixa_etaria: FAIXAS_ETARIAS[3].label, // "29 a 33 anos"
    telefone: '(21) 97531-2468',
    celular: '(21) 97531-2468',
    condicao_principal: 'Dislipidemia',
    risco: 'BAIXO',
    custo_12m: 2100.0,
    email: 'camila.pires@exemplo.com.br',
  },
  {
    matricula: 'MAT-000009',
    nome: 'Marcelo Barbosa Castro',
    vinculo: 'TITULAR',
    unidade: 'Belo Horizonte - Centro',
    faixa_etaria: FAIXAS_ETARIAS[6].label, // "44 a 48 anos"
    telefone: '(31) 99876-5432',
    celular: '(31) 99876-5432',
    condicao_principal: 'Obesidade Grau II',
    risco: 'MEDIO',
    custo_12m: 8900.0,
    email: 'marcelo.castro@grupogenki.com.br',
  },
  {
    matricula: 'MAT-000010',
    nome: 'Helena Nogueira Castro',
    vinculo: 'DEPENDENTE',
    unidade: 'Belo Horizonte - Centro',
    faixa_etaria: FAIXAS_ETARIAS[8].label, // "54 a 58 anos"
    telefone: '(31) 98765-4321',
    celular: '(31) 98765-4321',
    condicao_principal: 'J44 - OUTRAS DOENÇAS PULMONARES OBSTRUTIVAS CRÔNICAS',
    risco: 'ALTO',
    custo_12m: 19750.0,
    email: 'helena.castro@exemplo.com.br',
  },
]

/**
 * Gera um arquivo Excel (.xlsx) contendo os 10 registros de exemplo e aciona o download no navegador.
 */
export function downloadModeloBeneficiariosXlsx(
  fileName = 'modelo-importacao-beneficiarios.xlsx',
): void {
  // Converte a lista em uma worksheet do SheetJS
  const ws = XLSX.utils.json_to_sheet(DADOS_EXEMPLO_MODELO, {
    header: [
      'matricula',
      'nome',
      'vinculo',
      'unidade',
      'faixa_etaria',
      'telefone',
      'celular',
      'condicao_principal',
      'risco',
      'custo_12m',
      'email',
    ],
  })

  // Ajuste de largura das colunas para visualização agradável no Excel
  ws['!cols'] = [
    { wch: 14 }, // matricula
    { wch: 28 }, // nome
    { wch: 14 }, // vinculo
    { wch: 26 }, // unidade
    { wch: 18 }, // faixa_etaria
    { wch: 18 }, // telefone
    { wch: 18 }, // celular
    { wch: 45 }, // condicao_principal
    { wch: 12 }, // risco
    { wch: 14 }, // custo_12m
    { wch: 32 }, // email
  ]

  // Cria a pasta de trabalho (workbook)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Beneficiarios')

  // Gera o arquivo binário em formato array buffer
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })

  // Cria Blob e dispara o download
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
