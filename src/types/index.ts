export type UserPerfil =
  | 'GESTOR_VENART'
  | 'GESTOR_PROGRAMA'
  | 'GESTOR_RH'
  | 'OPERACAO'
  | 'GESTOR'
  | 'RH'
  | 'ATENDENTE'

export type TemaPreferido = 'LIGHT' | 'DARK'
export type CategoriaProfissional = 'ENFERMEIRO' | 'MEDICO' | 'ADMINISTRATIVO'
export type TipoProfissional = 'ENFERMEIRO' | 'MEDICO' | 'ADMINISTRATIVO'

export interface User {
  id: string
  email: string
  name: string
  perfil?: UserPerfil
  tema_preferido?: TemaPreferido
  categoria_profissional?: CategoriaProfissional
  tipo_profissional?: TipoProfissional
  registro_profissional?: string
  unidade_regiao?: string
  ativo?: boolean
  avatar?: string
  role?: string
  created?: string
  updated?: string
}

export type TipoLote = 'NOVO_REGISTRO' | 'ATUALIZACAO'
export type StatusLote = 'IMPORTADO' | 'PROCESSADO' | 'ERRO'

export interface LoteSelecao {
  id: string
  codigo_lote?: string
  lote_id?: string
  tipo_lote?: TipoLote
  data_importacao?: string
  data_selecao?: string
  usuario_importador_id?: string
  status_processamento?: StatusLote
  status?: StatusLote
  total_registros?: number
  total_beneficiarios?: number
  custo_total?: number
  criado_por?: string
  created?: string
  updated?: string
  expand?: {
    criado_por?: User
    usuario_importador_id?: User
  }
}

export type StatusBeneficiario =
  | 'ELEGIVEL'
  | 'SELECIONADO'
  | 'APROVADO'
  | 'EM_ATENDIMENTO'
  | 'ATENDIDO'
  | 'INATIVO'

export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
export type TipoVinculo = 'TITULAR' | 'DEPENDENTE'

export type FaixaEtariaId = '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10'

export interface Beneficiario {
  id: string
  id_externo?: string
  nome?: string
  nome_beneficiario?: string
  matricula: string
  unidade?: string
  unidade_regiao?: string
  vinculo?: TipoVinculo
  tipo_vinculo?: TipoVinculo
  faixa?: FaixaEtariaId | string
  faixa_etaria?: string
  telefone?: string
  celular?: string
  email?: string
  custo_12m?: number
  custo_12_meses?: number
  data_selecao?: string
  lote_id?: string
  status: StatusBeneficiario
  condicao_principal?: string
  risco?: NivelRisco
  permite_contato_whatsapp_sms?: boolean
  selecionado_por?: string
  data_selecao_gestao?: string
  aprovado_por?: string
  data_aprovacao?: string
  atendente_id?: string
  data_distribuicao?: string
  ativo: boolean
  titular_id?: string
  created?: string
  updated?: string
  expand?: {
    titular_id?: Beneficiario
    lote_id?: LoteSelecao
    selecionado_por?: User
    aprovado_por?: User
    atendente_id?: User
  }
}

export type PrioridadePlano = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'

export interface PlanoAcao {
  id: string
  necessidade_identificada: string
  objetivo: string
  acao_tomada: string
  prazo_acao_dias: number
  prioridade: PrioridadePlano
  ativo: boolean
  created?: string
  updated?: string
}

export interface ControlePrograma {
  id: string
  beneficiario_id: string
  condicao_principal: string
  risco: NivelRisco
  data_selecao: string
  responsavel: string
  ativo: boolean
  created?: string
  updated?: string
  expand?: {
    beneficiario_id?: Beneficiario
  }
}

export type MeioContato = 'LIGACAO_TELEFONICA' | 'WHATSAPP' | 'EMAIL' | 'SMS'
export type StatusContato = 'ATENDIDO' | 'OCUPADO' | 'SEM_RESPOSTA' | 'CONTATO_INCORRETO'
export type StatusGeralAtendimento =
  | 'EM_ACOMPANHAMENTO'
  | 'ALTA'
  | 'DESISTENCIA'
  | 'AGUARDANDO_RETORNO'
  | 'PROXIMO_CONTATO'

export interface FichaAtendimento {
  id: string
  ficha_id: string
  beneficiario_id: string
  atendente_id: string
  plano_acao_id?: string
  controle_programa_id?: string
  meio_contato: MeioContato
  condicao_principal: string
  data_contato: string
  risco: NivelRisco
  status_contato: StatusContato
  descricao_atendimento: string
  data_proximo_contato?: string
  responsavel: string
  meta: string
  observacoes?: string
  pendencias?: string
  status_geral: StatusGeralAtendimento
  data_alta?: string
  feedback?: number
  data_envio_pesquisa?: string
  data_resposta_pesquisa?: string
  versao: number
  ativo: boolean
  created?: string
  updated?: string
  expand?: {
    beneficiario_id?: Beneficiario
    atendente_id?: User
    plano_acao_id?: PlanoAcao
    controle_programa_id?: ControlePrograma
  }
}

export interface HistoricoFicha {
  id: string
  ficha_id: string
  dados_anteriores?: Record<string, unknown>
  campo_alterado: string
  valor_anterior: string
  valor_novo: string
  alterado_por?: string
  created?: string
  updated?: string
  expand?: {
    alterado_por?: User
  }
}

export type CanalPesquisa = 'EMAIL' | 'WHATSAPP'
export type StatusPesquisa = 'ENVIADO' | 'RESPONDIDO' | 'EXPIRADO'

export interface PesquisaSatisfacao {
  id: string
  ficha_id: string
  token: string
  nota?: number
  comentario?: string
  data_envio: string
  data_resposta?: string
  canal: CanalPesquisa
  status: StatusPesquisa
  created?: string
  updated?: string
  expand?: {
    ficha_id?: FichaAtendimento
  }
}

export interface LogAuditoria {
  id: string
  usuario_id?: string
  acao: string
  entidade: string
  entidade_id?: string
  dados_sensiveis: boolean
  detalhes?: Record<string, unknown>
  created?: string
  updated?: string
  expand?: {
    usuario_id?: User
  }
}

export type CampoLgpd = 'nome' | 'condicao_principal' | 'risco' | 'custo_12m'

export interface ConfigLgpdCampo {
  id: string
  perfil: UserPerfil
  campo: CampoLgpd
  visivel: boolean
  atualizado_por?: string
  atualizado_em?: string
  created?: string
  updated?: string
}

// Definição das 9 etapas do fluxo (PRD v0.0.4)
export interface EtapaFluxoDef {
  etapa: number
  titulo: string
  descricao: string
  responsavel:
    | 'GESTOR_VENART'
    | 'GESTOR_PROGRAMA'
    | 'GESTOR_RH'
    | 'OPERACAO'
    | 'BENEFICIARIO'
    | 'SISTEMA'
}

export const ETAPAS_FLUXO: EtapaFluxoDef[] = [
  {
    etapa: 1,
    titulo: 'Geração Planilha BI',
    descricao: 'BI gera planilha de elegíveis (.xlsx/.csv)',
    responsavel: 'SISTEMA',
  },
  {
    etapa: 2,
    titulo: 'Importação do Lote',
    descricao: 'Gestor Venart importa lote de novos registros ou atualizações',
    responsavel: 'GESTOR_VENART',
  },
  {
    etapa: 3,
    titulo: 'Seleção de Elegíveis',
    descricao: 'Gestor Venart seleciona elegíveis prioritários para o ciclo',
    responsavel: 'GESTOR_VENART',
  },
  {
    etapa: 4,
    titulo: 'Aprovação Clínica',
    descricao: 'Gestor do Programa valida e aprova clinicamente a inclusão',
    responsavel: 'GESTOR_PROGRAMA',
  },
  {
    etapa: 5,
    titulo: 'Distribuição Operacional',
    descricao: 'Gestor RH distribui os aprovados para a equipe de operação',
    responsavel: 'GESTOR_RH',
  },
  {
    etapa: 6,
    titulo: 'Atendimento Operacional',
    descricao: 'Operação executa contato e acompanha metas de saúde',
    responsavel: 'OPERACAO',
  },
  {
    etapa: 7,
    titulo: 'Plano de Ação e Alta',
    descricao: 'Atribuição de plano de cuidado individualizado e alta médica',
    responsavel: 'OPERACAO',
  },
  {
    etapa: 8,
    titulo: 'Pesquisa de Satisfação',
    descricao: 'Envio de link público de avaliação ao beneficiário',
    responsavel: 'BENEFICIARIO',
  },
  {
    etapa: 9,
    titulo: 'Analytics & Governança',
    descricao: 'Visualização consolidada de indicadores e conformidade LGPD',
    responsavel: 'GESTOR_VENART',
  },
]
