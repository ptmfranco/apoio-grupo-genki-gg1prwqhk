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

export type StatusBeneficiario =
  | 'ELEGIVEL'
  | 'SELECIONADO'
  | 'APROVADO'
  | 'EM_ATENDIMENTO'
  | 'ATENDIDO'
  | 'INATIVO'

export type TipoVinculo = 'TITULAR' | 'DEPENDENTE'
export type NivelRisco = 'BAIXO' | 'MEDIO' | 'ALTO' | 'CRITICO'
export type TipoLote = 'NOVO_REGISTRO' | 'ATUALIZACAO'
export type StatusLote = 'IMPORTADO' | 'PROCESSADO' | 'ERRO'
export type PrioridadePlano = 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE'
export type MeioContato = 'LIGACAO_TELEFONICA' | 'WHATSAPP' | 'EMAIL' | 'SMS'
export type StatusContato = 'ATENDIDO' | 'OCUPADO' | 'SEM_RESPOSTA' | 'CONTATO_INCORRETO'
export type StatusGeralFicha =
  | 'EM_ACOMPANHAMENTO'
  | 'ALTA'
  | 'DESISTENCIA'
  | 'AGUARDANDO_RETORNO'
  | 'PROXIMO_CONTATO'
  | 'CONTATO_WHATSAPP'
export type TipoApontamentoRH = 'SELECAO' | 'EVOLUCAO' | 'VOLUMETRIA' | 'CUSTO'
export type StatusPesquisa = 'ENVIADO' | 'RESPONDIDO' | 'EXPIRADO'

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

export interface User {
  id: string
  name: string
  email: string
  perfil: UserPerfil
  tema_preferido?: TemaPreferido
  categoria_profissional?: CategoriaProfissional
  tipo_profissional?: TipoProfissional
  registro_profissional?: string
  unidade_regiao?: string
  ativo: boolean
  created?: string
  updated?: string
}

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
  permite_contato_whatsapp_sms?: boolean
  status: StatusBeneficiario
  lote_id?: string
  selecionado_por?: string
  data_selecao?: string
  data_selecao_gestao?: string
  aprovado_por?: string
  data_aprovacao?: string
  atendente_id?: string
  data_distribuicao?: string
  ativo: boolean
  // Dados sensíveis sujeitos a controle LGPD
  condicao_principal?: string
  risco?: NivelRisco
  custo_12m?: number
  custo_12_meses?: number
  titular_id?: string
  expand?: {
    titular_id?: Beneficiario
    lote_id?: LoteSelecao
    atendente_id?: User
    selecionado_por?: User
    aprovado_por?: User
  }
  created?: string
  updated?: string
}

export interface LoteSelecao {
  id: string
  codigo_lote?: string
  lote_id?: string
  tipo_lote?: TipoLote
  data_importacao?: string
  data_selecao?: string
  usuario_importador_id?: string
  criado_por?: string
  total_registros?: number
  total_beneficiarios?: number
  custo_total?: number
  status_processamento?: StatusLote
  status?: StatusLote
  expand?: {
    criado_por?: User
    usuario_importador_id?: User
  }
  created?: string
  updated?: string
}

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
  expand?: {
    beneficiario_id?: Beneficiario
  }
  created?: string
  updated?: string
}

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
  observacoes: string
  pendencias: string
  status_geral: StatusGeralFicha
  data_alta?: string
  feedback?: number
  data_envio_pesquisa?: string
  data_resposta_pesquisa?: string
  versao: number
  ativo: boolean
  expand?: {
    beneficiario_id?: Beneficiario
    atendente_id?: User
    plano_acao_id?: PlanoAcao
    controle_programa_id?: ControlePrograma
  }
  created?: string
  updated?: string
}

export interface HistoricoFicha {
  id: string
  ficha_id: string
  dados_anteriores: Record<string, unknown>
  campo_alterado: string
  valor_anterior: string
  valor_novo: string
  alterado_por?: string
  expand?: {
    alterado_por?: User
    ficha_id?: FichaAtendimento
  }
  created?: string
  updated?: string
}

export interface PesquisaSatisfacao {
  id: string
  ficha_id: string
  token: string
  nota: number
  comentario: string
  data_envio: string
  data_resposta?: string
  canal: 'EMAIL' | 'WHATSAPP'
  status: StatusPesquisa
  expand?: {
    ficha_id?: FichaAtendimento
  }
  created?: string
  updated?: string
}

export interface ApontamentoRH {
  id: string
  lote_id: string
  tipo_apontamento: TipoApontamentoRH
  descricao: string
  periodo_referencia: string
  metricas: Record<string, unknown>
  created?: string
  updated?: string
}

export interface DashboardCache {
  id: string
  atendente_id?: string
  perfil?: UserPerfil
  tipo_dashboard?: 'ATENDENTE' | 'GESTOR' | 'COMPARATIVO' | 'SATISFACAO'
  periodo_referencia: string
  indicadores: Record<string, unknown>
  data_atualizacao?: string
}

export type TipoQuestaoClinica = 'sim_nao' | 'escala' | 'texto_livre' | 'multipla_escolha'

export interface QuestaoClinica {
  id: string
  enunciado: string
  tipo: TipoQuestaoClinica
  obrigatoria?: boolean
  opcoes?: string[] // Para multipla_escolha
  escalaMin?: number // Para escala (ex: 0)
  escalaMax?: number // Para escala (ex: 5)
  legendaMin?: string
  legendaMax?: string
  placeholder?: string
}

export interface QuestionarioTemplate {
  id: string
  condicao_principal: string
  titulo: string
  descricao?: string
  ativo: boolean
  questoes: QuestaoClinica[]
  created?: string
  updated?: string
}

export interface RespostaQuestionario {
  id: string
  ficha_id: string
  template_id: string
  respostas: Record<string, any> // id_questao -> valor
  preenchido_por?: string
  data_preenchimento?: string
  expand?: {
    ficha_id?: FichaAtendimento
    template_id?: QuestionarioTemplate
    preenchido_por?: User
  }
  created?: string
  updated?: string
}
