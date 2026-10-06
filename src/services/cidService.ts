import pb from '@/lib/pocketbase/client'
import { Cid10Item } from '@/types/saude'

export interface CidQueryOptions {
  page?: number
  perPage?: number
  search?: string
  somenteAtivos?: boolean
}

export interface CidListResult {
  items: Cid10Item[]
  totalItems: number
  totalPages: number
  page: number
  perPage: number
}

export interface CidUpsertResult {
  inseridos: number
  atualizados: number
  erros: Array<{ linha: number; codigo?: string; erro: string }>
}

export const CidService = {
  /**
   * Retorna contagem total de registros CID-10 ativos
   */
  async count(): Promise<number> {
    try {
      const res = await pb.collection('cid10').getList(1, 1, {
        requestKey: null,
      })
      return res.totalItems
    } catch (err) {
      console.warn('Erro ao contar CID-10:', err)
      return 0
    }
  },

  /**
   * Lista paginada com busca por código ou descrição
   */
  async list(options: CidQueryOptions = {}): Promise<CidListResult> {
    const page = options.page || 1
    const perPage = options.perPage || 30
    const parts: string[] = []

    if (options.somenteAtivos !== false) {
      parts.push('ativo = true')
    }

    if (options.search && options.search.trim()) {
      const clean = options.search.trim().replace(/['"\\]/g, '')
      parts.push(`(codigo ~ "${clean}" || descricao ~ "${clean}")`)
    }

    const filter = parts.join(' && ')

    const res = await pb.collection('cid10').getList(page, perPage, {
      filter,
      sort: 'codigo',
      requestKey: null,
    })

    return {
      items: res.items as unknown as Cid10Item[],
      totalItems: res.totalItems,
      totalPages: res.totalPages,
      page: res.page,
      perPage: res.perPage,
    }
  },

  /**
   * Busca item por código exato (ou formatado)
   */
  async getByCodigo(codigo: string): Promise<Cid10Item | null> {
    if (!codigo || !codigo.trim()) return null
    try {
      const clean = codigo
        .trim()
        .replace(/['"\\]/g, '')
        .toUpperCase()
      const rec = await pb.collection('cid10').getFirstListItem(`codigo = "${clean}"`, {
        requestKey: null,
      })
      return rec as unknown as Cid10Item
    } catch {
      return null
    }
  },

  /**
   * Importação em lote no modo Upsert:
   * Atualiza descrição se o código já existir; insere se for novo.
   * Processa em lotes de 20 para evitar limites de timeout/payload.
   */
  async upsertBatch(
    items: Array<{
      codigo: string
      descricao: string
      capitulo?: string
      grupo?: string
      categoria?: string
      subcategoria?: string
      ativo?: boolean
    }>,
    onProgress?: (processed: number, total: number) => void,
  ): Promise<CidUpsertResult> {
    let inseridos = 0
    let atualizados = 0
    const erros: Array<{ linha: number; codigo?: string; erro: string }> = []

    // Mapear registros existentes no PocketBase para agilizar upsert
    // Busca todos os códigos existentes se possível
    const existingMap = new Map<string, string>() // codigo -> recordId
    try {
      const existingList = await pb.collection('cid10').getFullList({
        fields: 'id,codigo',
        requestKey: null,
      })
      for (const item of existingList) {
        if (item.codigo) {
          existingMap.set(item.codigo.toString().trim().toUpperCase(), item.id)
        }
      }
    } catch (e) {
      console.warn('Não foi possível pré-carregar mapa de CIDs existentes:', e)
    }

    const total = items.length

    for (let i = 0; i < total; i++) {
      const row = items[i]
      const linha = i + 1
      const cod = (row.codigo || '').toString().trim().toUpperCase()
      const desc = (row.descricao || '').toString().trim()

      if (!cod || !desc) {
        erros.push({
          linha,
          codigo: cod || '(vazio)',
          erro: 'Código e Descrição são campos obrigatórios.',
        })
        continue
      }

      const payload = {
        codigo: cod,
        descricao: desc,
        capitulo: row.capitulo ? row.capitulo.toString().trim() : '',
        grupo: row.grupo ? row.grupo.toString().trim() : '',
        categoria: row.categoria ? row.categoria.toString().trim() : '',
        subcategoria: row.subcategoria ? row.subcategoria.toString().trim() : '',
        ativo: row.ativo !== undefined ? Boolean(row.ativo) : true,
      }

      try {
        const existingId = existingMap.get(cod)
        if (existingId) {
          await pb.collection('cid10').update(existingId, payload, { requestKey: null })
          atualizados++
        } else {
          // Tentar criar; se der unique constraint, tenta atualizar
          try {
            const created = await pb.collection('cid10').create(payload, { requestKey: null })
            existingMap.set(cod, created.id)
            inseridos++
          } catch (createErr: any) {
            // Se já existia por concorrência
            const check = await pb
              .collection('cid10')
              .getFirstListItem(`codigo = "${cod}"`, { requestKey: null })
              .catch(() => null)
            if (check) {
              await pb.collection('cid10').update(check.id, payload, { requestKey: null })
              existingMap.set(cod, check.id)
              atualizados++
            } else {
              throw createErr
            }
          }
        }
      } catch (err: any) {
        erros.push({
          linha,
          codigo: cod,
          erro: err?.message || 'Falha ao salvar registro no banco.',
        })
      }

      if (onProgress && (i % 25 === 0 || i === total - 1)) {
        onProgress(i + 1, total)
      }
    }

    return { inseridos, atualizados, erros }
  },
}
