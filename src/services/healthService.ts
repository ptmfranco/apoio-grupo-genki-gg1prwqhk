import pb from '@/lib/pocketbase/client'
import type {
  User,
  LoteSelecao,
  Beneficiario,
  PlanoAcao,
  ControlePrograma,
  FichaAtendimento,
  HistoricoFicha,
  PesquisaSatisfacao,
  LogAuditoria,
  UserPerfil,
} from '@/types'
import { normalizeFaixaId } from '@/constants/faixasEtarias'

// Logger de auditoria
export async function logAcao(
  acao: string,
  entidade: string,
  entidadeId?: string,
  dadosSensiveis = false,
  detalhes?: Record<string, unknown>,
): Promise<void> {
  try {
    const userId = pb.authStore.record?.id
    await pb.collection('logs_auditoria').create({
      usuario_id: userId || null,
      acao,
      entidade,
      entidade_id: entidadeId || '',
      dados_sensiveis: dadosSensiveis,
      detalhes: detalhes || {},
    })
  } catch (err) {
    console.warn('Erro ao registrar log de auditoria:', err)
  }
}

// ----------------- USUÁRIOS -----------------
export async function getUsuarios(): Promise<User[]> {
  return await pb.collection('users').getFullList<User>({
    sort: 'name',
  })
}

export async function getAtendentes(): Promise<User[]> {
  return await pb.collection('users').getFullList<User>({
    filter: '(perfil = "OPERACAO" || perfil = "ATENDENTE") && ativo = true',
    sort: 'name',
  })
}

export async function createUsuario(data: Partial<User> & { password?: string }): Promise<User> {
  const rawPerfil = data.perfil || 'OPERACAO'
  let normalizedPerfil: UserPerfil = 'OPERACAO'
  if (rawPerfil === 'SUPERUSUARIO') normalizedPerfil = 'SUPERUSUARIO'
  else if (rawPerfil === 'GESTOR' || rawPerfil === 'GESTOR_VENART')
    normalizedPerfil = 'GESTOR_VENART'
  else if (rawPerfil === 'GESTOR_PROGRAMA') normalizedPerfil = 'GESTOR_PROGRAMA'
  else if (rawPerfil === 'RH' || rawPerfil === 'GESTOR_RH') normalizedPerfil = 'GESTOR_RH'
  else normalizedPerfil = 'OPERACAO'

  const cat = data.categoria_profissional || (data.tipo_profissional as any) || 'ADMINISTRATIVO'
  const normalizedCategoria = ['ENFERMEIRO', 'MEDICO', 'ADMINISTRATIVO'].includes(cat)
    ? cat
    : 'ADMINISTRATIVO'

  const tipo = data.tipo_profissional
  const normalizedTipo = tipo === 'ENFERMEIRO' || tipo === 'MEDICO' ? tipo : ''
  const password =
    data.password && data.password.trim().length >= 8
      ? data.password.trim()
      : `VenArt#${Math.random().toString(36).slice(2, 6).toUpperCase()}!${Math.floor(100 + Math.random() * 900)}`

  const payload: Record<string, any> = {
    name: (data.name || '').trim(),
    email: (data.email || '').trim().toLowerCase(),
    password,
    passwordConfirm: password,
    emailVisibility: true,
    verified: true,
    perfil: normalizedPerfil,
    tema_preferido: data.tema_preferido === 'DARK' ? 'DARK' : 'LIGHT',
    categoria_profissional: normalizedCategoria,
    registro_profissional: (data.registro_profissional || '').trim(),
    unidade_regiao: (data.unidade_regiao || 'São Paulo').trim(),
    ativo: data.ativo ?? true,
  }

  if (normalizedTipo) {
    payload.tipo_profissional = normalizedTipo
  }

  const res = await pb.collection('users').create<User>(payload)
  await logAcao('CRIAR_USUARIO', 'users', res.id, false, { nome: res.name, perfil: res.perfil })
  return res
}

export async function updateUsuario(
  id: string,
  data: Partial<User> & {
    novaSenha?: string
    confirmarSenha?: string
    password?: string
    passwordConfirm?: string
    oldPassword?: string
  },
): Promise<User> {
  const cleanId = (id || '').trim()
  if (!cleanId) {
    throw new Error('ID do usuário não informado para atualização.')
  }

  // Carregar dados atuais para enviar apenas e-mail alterado e evitar conflitos
  let currentUserRecord: User | null = null
  try {
    currentUserRecord = await pb.collection('users').getOne<User>(cleanId)
  } catch {
    /* intentionally ignored */
  }

  const payload: Record<string, any> = {}

  if (data.name !== undefined) {
    payload.name = data.name.trim()
  }

  if (data.email !== undefined) {
    const trimmed = data.email.trim().toLowerCase()
    if (trimmed) {
      payload.email = trimmed
    }
  }
  payload.emailVisibility = true

  if (data.perfil !== undefined) {
    let norm: UserPerfil = 'OPERACAO'
    if (data.perfil === 'SUPERUSUARIO') norm = 'SUPERUSUARIO'
    else if (data.perfil === 'GESTOR' || data.perfil === 'GESTOR_VENART') norm = 'GESTOR_VENART'
    else if (data.perfil === 'GESTOR_PROGRAMA') norm = 'GESTOR_PROGRAMA'
    else if (data.perfil === 'RH' || data.perfil === 'GESTOR_RH') norm = 'GESTOR_RH'
    else norm = 'OPERACAO'

    payload.perfil = norm
  }

  if (data.tema_preferido !== undefined) {
    payload.tema_preferido = data.tema_preferido === 'DARK' ? 'DARK' : 'LIGHT'
  }

  if (data.categoria_profissional !== undefined) {
    const cat = data.categoria_profissional
    payload.categoria_profissional = ['ENFERMEIRO', 'MEDICO', 'ADMINISTRATIVO'].includes(cat)
      ? cat
      : 'ADMINISTRATIVO'
  }

  if (data.tipo_profissional !== undefined) {
    payload.tipo_profissional =
      data.tipo_profissional === 'ENFERMEIRO' || data.tipo_profissional === 'MEDICO'
        ? data.tipo_profissional
        : ''
  }

  if (data.registro_profissional !== undefined) {
    payload.registro_profissional = data.registro_profissional.trim()
  }

  if (data.unidade_regiao !== undefined) {
    payload.unidade_regiao = data.unidade_regiao.trim()
  }

  if (data.ativo !== undefined) {
    payload.ativo = Boolean(data.ativo)
  }

  // Senhas opcionais: validar antes de enviar
  const newPass = (data.novaSenha || data.password || '').trim()
  const confPass = (data.confirmarSenha || data.passwordConfirm || '').trim()

  if (newPass) {
    if (newPass.length < 8) {
      throw new Error('A nova senha deve ter no mínimo 8 caracteres.')
    }
    if (confPass && newPass !== confPass) {
      throw new Error('A confirmação da nova senha não confere.')
    }
    payload.password = newPass
    payload.passwordConfirm = confPass || newPass

    const isSelf = pb.authStore.record?.id === cleanId
    if (isSelf && data.oldPassword && data.oldPassword.trim()) {
      payload.oldPassword = data.oldPassword.trim()
    }
  }

  let res: User
  let finalErr: any = null
  try {
    // Tenta primeiro o endpoint dedicado para SUPERUSUARIO / atualização segura
    res = await pb.send<User>(`/backend/v1/users/${encodeURIComponent(cleanId)}/update`, {
      method: 'POST',
      body: payload,
    })
  } catch (endpointErr: any) {
    finalErr = endpointErr
    if (endpointErr?.status === 404) {
      try {
        res = await pb.collection('users').update<User>(cleanId, payload)
        finalErr = null
      } catch (sdkErr: any) {
        finalErr = sdkErr
      }
    }

    if (finalErr) {
      const status = finalErr?.status || finalErr?.statusCode
      if (status === 401) {
        throw new Error('Sua sessão expirou. Faça login novamente.')
      }
      if (status === 403) {
        throw new Error(
          'Acesso negado. Apenas o Super Usuário tem permissão para gerenciar usuários.',
        )
      }
      if (status === 404) {
        throw new Error('Usuário não encontrado.')
      }
      if (status === 409) {
        throw new Error('O e-mail informado já está em uso por outro usuário.')
      }

      const detail = finalErr?.data?.data
      if (detail && typeof detail === 'object') {
        const msgs: string[] = []
        for (const [k, v] of Object.entries(detail) as [string, any][]) {
          let msg = v?.message || String(v)
          if (msg.includes("Values don't match") || msg.includes('do not match')) {
            msg = 'Os valores não conferem.'
          } else if (msg.includes('Cannot be blank')) {
            msg = 'Campo obrigatório.'
          } else if (msg.includes('must be at least')) {
            msg = 'Tamanho mínimo não atingido.'
          }
          if (k === 'email') msgs.push(`E-mail: ${msg}`)
          else if (k === 'oldPassword') msgs.push(`Senha atual: ${msg}`)
          else if (k === 'password') msgs.push(`Nova senha: ${msg}`)
          else if (k === 'passwordConfirm') msgs.push(`Confirmação de senha: ${msg}`)
          else msgs.push(`${k}: ${msg}`)
        }
        if (msgs.length > 0) {
          throw new Error(`Erro nos campos: ${msgs.join(', ')}`)
        }
      }

      throw new Error(
        finalErr?.data?.message || finalErr?.message || 'Erro ao atualizar dados do usuário.',
      )
    }
  }

  await logAcao('ATUALIZAR_USUARIO', 'users', cleanId, false, {
    id: cleanId,
    name: res.name,
    perfil: res.perfil,
  })
  return res
}

export async function toggleAtivoUsuario(id: string, ativoAtual: boolean): Promise<User> {
  const cleanId = (id || '').trim()
  if (!cleanId) {
    throw new Error('ID do usuário não informado para alteração de status.')
  }
  const res = await pb.collection('users').update<User>(cleanId, { ativo: !ativoAtual })
  await logAcao('ALTERAR_STATUS_USUARIO', 'users', cleanId, false, { ativo: !ativoAtual })
  return res
}

// ----------------- LOTES DE SELEÇÃO -----------------
export async function getLotes(): Promise<LoteSelecao[]> {
  return await pb.collection('lotes_selecao').getFullList<LoteSelecao>({
    sort: '-created',
    expand: 'criado_por',
  })
}

export async function createLote(data: Partial<LoteSelecao>): Promise<LoteSelecao> {
  const res = await pb.collection('lotes_selecao').create<LoteSelecao>(data)
  await logAcao('IMPORTAR_LOTE', 'lotes_selecao', res.id, true, {
    lote_id: res.lote_id,
    total: res.total_beneficiarios,
  })
  return res
}

// ----------------- BENEFICIÁRIOS -----------------
export async function getBeneficiarios(filter?: string): Promise<Beneficiario[]> {
  return await pb.collection('beneficiarios').getFullList<Beneficiario>({
    filter: filter ? `${filter} && ativo = true` : 'ativo = true',
    sort: 'nome_beneficiario',
    expand: 'lote_id,titular_id,atendente_id,selecionado_por',
  })
}

export async function getAllBeneficiariosAdmin(): Promise<Beneficiario[]> {
  return await pb.collection('beneficiarios').getFullList<Beneficiario>({
    sort: 'nome_beneficiario',
    expand: 'lote_id,titular_id,atendente_id,selecionado_por',
  })
}

export async function getBeneficiarioById(id: string): Promise<Beneficiario> {
  return await pb.collection('beneficiarios').getOne<Beneficiario>(id, {
    expand: 'lote_id,titular_id,atendente_id,selecionado_por',
  })
}

export async function createBeneficiario(data: Partial<Beneficiario>): Promise<Beneficiario> {
  const rawFaixa = data.faixa || data.faixa_etaria
  const normalizedFaixa = rawFaixa ? normalizeFaixaId(rawFaixa) : '05'

  const res = await pb.collection('beneficiarios').create<Beneficiario>({
    ...data,
    faixa: normalizedFaixa,
    faixa_etaria: normalizedFaixa,
    ativo: data.ativo ?? true,
  })
  await logAcao('CRIAR_BENEFICIARIO', 'beneficiarios', res.id, true, { matricula: res.matricula })
  return res
}

export async function updateBeneficiario(
  id: string,
  data: Partial<Beneficiario>,
): Promise<Beneficiario> {
  const payload: any = { ...data }
  if (data.faixa || data.faixa_etaria) {
    const normalizedFaixa = normalizeFaixaId(data.faixa || data.faixa_etaria)
    payload.faixa = normalizedFaixa
    payload.faixa_etaria = normalizedFaixa
  }

  const res = await pb.collection('beneficiarios').update<Beneficiario>(id, payload)
  await logAcao('ATUALIZAR_BENEFICIARIO', 'beneficiarios', id, true, data)
  return res
}

export async function softDeleteBeneficiario(id: string): Promise<Beneficiario> {
  const res = await pb.collection('beneficiarios').update<Beneficiario>(id, { ativo: false })
  await logAcao('DESATIVAR_BENEFICIARIO', 'beneficiarios', id, false)
  return res
}

// GESTOR seleciona elegíveis
export async function selecionarElegiveis(ids: string[]): Promise<void> {
  const userId = pb.authStore.record?.id
  const now = new Date().toISOString()
  for (const id of ids) {
    await pb.collection('beneficiarios').update(id, {
      status: 'SELECIONADO',
      selecionado_por: userId,
      data_selecao_gestao: now,
    })
  }
  await logAcao('SELECIONAR_ELEGIVEIS', 'beneficiarios', undefined, false, {
    count: ids.length,
    ids,
  })
}

// RH distribui para atendente
export async function distribuirParaAtendente(
  beneficiarioIds: string[],
  atendenteId: string,
): Promise<void> {
  const now = new Date().toISOString()
  for (const id of beneficiarioIds) {
    await pb.collection('beneficiarios').update(id, {
      atendente_id: atendenteId,
      data_distribuicao: now,
      status: 'EM_ATENDIMENTO',
    })
  }
  await logAcao('DISTRIBUIR_ATENDENTE', 'beneficiarios', undefined, false, {
    atendenteId,
    count: beneficiarioIds.length,
  })
}

// ----------------- PLANOS DE AÇÃO -----------------
export async function getPlanosAcao(): Promise<PlanoAcao[]> {
  return await pb.collection('planos_acao').getFullList<PlanoAcao>({
    sort: 'necessidade_identificada',
    filter: 'ativo = true',
  })
}

export async function getAllPlanosAcao(): Promise<PlanoAcao[]> {
  return await pb.collection('planos_acao').getFullList<PlanoAcao>({
    sort: 'necessidade_identificada',
  })
}

export async function createPlanoAcao(data: Partial<PlanoAcao>): Promise<PlanoAcao> {
  const res = await pb.collection('planos_acao').create<PlanoAcao>({ ...data, ativo: true })
  await logAcao('CRIAR_PLANO_ACAO', 'planos_acao', res.id, false, { objetivo: res.objetivo })
  return res
}

export async function updatePlanoAcao(id: string, data: Partial<PlanoAcao>): Promise<PlanoAcao> {
  const res = await pb.collection('planos_acao').update<PlanoAcao>(id, data)
  await logAcao('ATUALIZAR_PLANO_ACAO', 'planos_acao', id, false, data)
  return res
}

export async function toggleAtivoPlanoAcao(id: string, ativoAtual: boolean): Promise<PlanoAcao> {
  const res = await pb.collection('planos_acao').update<PlanoAcao>(id, { ativo: !ativoAtual })
  return res
}

// ----------------- CONTROLE DE PROGRAMAS -----------------
export async function getProgramas(): Promise<ControlePrograma[]> {
  return await pb.collection('controle_programas').getFullList<ControlePrograma>({
    sort: '-created',
    filter: 'ativo = true',
    expand: 'beneficiario_id',
  })
}

export async function getAllProgramas(): Promise<ControlePrograma[]> {
  return await pb.collection('controle_programas').getFullList<ControlePrograma>({
    sort: '-created',
    expand: 'beneficiario_id',
  })
}

export async function createPrograma(data: Partial<ControlePrograma>): Promise<ControlePrograma> {
  const res = await pb
    .collection('controle_programas')
    .create<ControlePrograma>({ ...data, ativo: true })
  await logAcao('CRIAR_PROGRAMA', 'controle_programas', res.id, false)
  return res
}

export async function updatePrograma(
  id: string,
  data: Partial<ControlePrograma>,
): Promise<ControlePrograma> {
  const res = await pb.collection('controle_programas').update<ControlePrograma>(id, data)
  await logAcao('ATUALIZAR_PROGRAMA', 'controle_programas', id, false, data)
  return res
}

// ----------------- FICHAS DE ATENDIMENTO -----------------
export async function getFichas(filter?: string): Promise<FichaAtendimento[]> {
  return await pb.collection('fichas_atendimento').getFullList<FichaAtendimento>({
    filter: filter ? `${filter} && ativo = true` : 'ativo = true',
    sort: '-created',
    expand: 'beneficiario_id,atendente_id,plano_acao_id,controle_programa_id',
  })
}

export async function getFichaById(id: string): Promise<FichaAtendimento> {
  return await pb.collection('fichas_atendimento').getOne<FichaAtendimento>(id, {
    expand: 'beneficiario_id,atendente_id,plano_acao_id,controle_programa_id',
  })
}

export async function getHistoricoFicha(fichaId: string): Promise<HistoricoFicha[]> {
  return await pb.collection('historico_fichas').getFullList<HistoricoFicha>({
    filter: `ficha_id = "${fichaId}"`,
    sort: '-created',
    expand: 'alterado_por',
  })
}

export async function createFichaAtendimento(
  data: Partial<FichaAtendimento>,
): Promise<FichaAtendimento> {
  const fichaIdCode =
    data.ficha_id || `FICHA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
  const res = await pb.collection('fichas_atendimento').create<FichaAtendimento>({
    ...data,
    ficha_id: fichaIdCode,
    versao: 1,
    ativo: true,
  })

  // Se já nasceu em ALTA, disparar rotina de pesquisa
  if (data.status_geral === 'ALTA') {
    await processarAltaFicha(res.id, res.beneficiario_id)
  }

  await logAcao('CRIAR_FICHA', 'fichas_atendimento', res.id, true, { ficha_id: fichaIdCode })
  return res
}

export async function updateFichaComHistorico(
  fichaId: string,
  novosDados: Partial<FichaAtendimento>,
  fichaAnterior: FichaAtendimento,
): Promise<FichaAtendimento> {
  const userId = pb.authStore.record?.id
  const novaVersao = (fichaAnterior.versao || 1) + 1

  // Registrar histórico das alterações
  const camposAlterados: string[] = []
  for (const key of Object.keys(novosDados) as (keyof FichaAtendimento)[]) {
    if (
      novosDados[key] !== undefined &&
      novosDados[key] !== (fichaAnterior as unknown as Record<string, unknown>)[key as string]
    ) {
      camposAlterados.push(key as string)
      try {
        await pb.collection('historico_fichas').create({
          ficha_id: fichaId,
          campo_alterado: key,
          valor_anterior: String(
            (fichaAnterior as unknown as Record<string, unknown>)[key as string] || '',
          ),
          valor_novo: String(novosDados[key] || ''),
          alterado_por: userId || null,
          dados_anteriores: fichaAnterior,
        })
      } catch (err) {
        console.warn('Erro ao salvar histórico de campo:', err)
      }
    }
  }

  const payload = {
    ...novosDados,
    versao: novaVersao,
  }

  const updated = await pb
    .collection('fichas_atendimento')
    .update<FichaAtendimento>(fichaId, payload)

  // Se mudou para ALTA e antes não era
  if (novosDados.status_geral === 'ALTA' && fichaAnterior.status_geral !== 'ALTA') {
    await processarAltaFicha(fichaId, updated.beneficiario_id)
  }

  await logAcao('ATUALIZAR_FICHA', 'fichas_atendimento', fichaId, true, {
    versao: novaVersao,
    campos: camposAlterados,
  })
  return updated
}

// Fechar com alta e gerar token público de pesquisa simulada
export async function processarAltaFicha(
  fichaId: string,
  beneficiarioId?: string,
): Promise<string> {
  const now = new Date().toISOString()
  const randomSuffix = Math.random().toString(36).substring(2, 10)
  const token = `survey-${Date.now()}-${randomSuffix}`

  // Atualiza ficha
  await pb.collection('fichas_atendimento').update(fichaId, {
    status_geral: 'ALTA',
    data_alta: now,
    data_envio_pesquisa: now,
  })

  // Atualiza status do beneficiário para ATENDIDO
  if (beneficiarioId) {
    try {
      await pb.collection('beneficiarios').update(beneficiarioId, {
        status: 'ATENDIDO',
      })
    } catch {
      /* intentionally ignored */
    }
  }

  // Cria registro de pesquisa de satisfação
  await pb.collection('pesquisas_satisfacao').create({
    ficha_id: fichaId,
    token,
    data_envio: now,
    canal: 'WHATSAPP',
    status: 'ENVIADO',
  })

  await logAcao('ALTA_PACIENTE_PESQUISA_GERADA', 'fichas_atendimento', fichaId, false, { token })
  return token
}

// ----------------- PESQUISAS DE SATISFAÇÃO -----------------
export async function getPesquisas(): Promise<PesquisaSatisfacao[]> {
  return await pb.collection('pesquisas_satisfacao').getFullList<PesquisaSatisfacao>({
    sort: '-created',
    expand: 'ficha_id.beneficiario_id,ficha_id.atendente_id',
  })
}

export async function getPesquisaByToken(token: string): Promise<PesquisaSatisfacao | null> {
  try {
    const list = await pb.collection('pesquisas_satisfacao').getFullList<PesquisaSatisfacao>({
      filter: `token = "${token}"`,
      expand: 'ficha_id.beneficiario_id,ficha_id.atendente_id',
    })
    return list[0] || null
  } catch (_) {
    return null
  }
}

export async function responderPesquisa(
  token: string,
  nota: number,
  comentario: string,
): Promise<PesquisaSatisfacao> {
  const pesquisa = await getPesquisaByToken(token)
  if (!pesquisa) {
    throw new Error('Pesquisa não encontrada para este link.')
  }
  if (pesquisa.status === 'RESPONDIDO') {
    throw new Error('Esta pesquisa já foi respondida anteriormente.')
  }

  const now = new Date().toISOString()
  const updated = await pb
    .collection('pesquisas_satisfacao')
    .update<PesquisaSatisfacao>(pesquisa.id, {
      nota,
      comentario,
      data_resposta: now,
      status: 'RESPONDIDO',
    })

  // Atualiza nota na ficha de atendimento correspondente
  try {
    await pb.collection('fichas_atendimento').update(pesquisa.ficha_id, {
      feedback: nota,
      data_resposta_pesquisa: now,
    })
  } catch (err) {
    console.warn('Erro ao atualizar feedback na ficha:', err)
  }

  return updated
}

// ----------------- HELPERS LGPD -----------------
export function aplicarFiltroLgpdBeneficiario(
  b: Beneficiario,
  perfil?: UserPerfil,
): Partial<Beneficiario> {
  if (perfil === 'GESTOR_PROGRAMA' || perfil === 'GESTOR') {
    return b
  }

  if (perfil === 'GESTOR_VENART' || perfil === 'GESTOR_RH' || perfil === 'RH') {
    return {
      ...b,
      nome: `Beneficiário (${b.matricula})`,
      nome_beneficiario: `Beneficiário (${b.matricula})`,
    }
  }

  if (perfil === 'OPERACAO' || perfil === 'ATENDENTE') {
    const { custo_12_meses, custo_12m, condicao_principal, risco, ...rest } = b as any
    return {
      ...rest,
      nome: `Beneficiário (${b.matricula})`,
      nome_beneficiario: `Beneficiário (${b.matricula})`,
    }
  }

  return b
}
