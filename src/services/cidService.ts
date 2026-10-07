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
  removidos: number
  erros: Array<{ linha: number; codigo?: string; erro: string }>
}

export interface CidItemInput {
  codigo: string
  descricao: string
  capitulo?: string
  grupo?: string
  categoria?: string
  subcategoria?: string
  ativo?: boolean
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
   * Limpa todos os registros do catálogo CID-10.
   * Tenta via endpoint atômico do backend (truncate); se falhar, remove via SDK em batches.
   * ATENÇÃO: afeta EXCLUSIVAMENTE a coleção 'cid10', preservando questionários, beneficiários, etc.
   */
  async clearAll(onProgress?: (deleted: number, total: number) => void): Promise<number> {
    // 1. Tentar hook de truncate rápido no backend
    try {
      await pb.send('/backend/v1/cid10/truncate', {
        method: 'POST',
      })
      return (await this.count()) === 0 ? 1 : 0
    } catch (endpointErr) {
      console.warn(
        'Endpoint de truncate falhou ou indisponível, usando fallback via SDK:',
        endpointErr,
      )
    }

    // 2. Fallback: buscar IDs e deletar concorrentemente em pequenos lotes
    const allRecords = await pb.collection('cid10').getFullList<{ id: string }>({
      fields: 'id',
      requestKey: null,
    })

    const total = allRecords.length
    if (total === 0) return 0

    let deleted = 0
    const CHUNK_SIZE = 25

    for (let i = 0; i < total; i += CHUNK_SIZE) {
      const chunk = allRecords.slice(i, i + CHUNK_SIZE)
      await Promise.allSettled(
        chunk.map(async (r) => {
          try {
            await pb.collection('cid10').delete(r.id, { requestKey: null })
            deleted++
          } catch (e) {
            console.warn(`Falha ao excluir CID ${r.id}:`, e)
          }
        }),
      )

      if (onProgress) {
        onProgress(Math.min(deleted, total), total)
      }
    }

    return deleted
  },

  /**
   * Importação de registros CID-10 comportando ~1.800+ linhas sem travar a interface.
   * Modos suportados:
   *  - 'replace': Limpa a coleção inteira antes de inserir os novos
   *  - 'upsert': Atualiza descrição se o código já existir; insere se for novo
   *
   * Utiliza chunks paralelos controlados (5 a 10 requisições simultâneas) e yields (await new Promise)
   * para liberar a main-thread do browser, atualizando a barra de progresso suavemente.
   */
  async importBatch(
    items: CidItemInput[],
    mode: 'replace' | 'upsert' = 'upsert',
    onProgress?: (processed: number, total: number, phase: 'deleting' | 'importing') => void,
  ): Promise<CidUpsertResult> {
    let inseridos = 0
    let atualizados = 0
    let removidos = 0
    const erros: Array<{ linha: number; codigo?: string; erro: string }> = []

    const total = items.length

    // Mapeamento de registros existentes no PocketBase
    const existingMap = new Map<string, string>() // codigo -> recordId

    if (mode === 'replace') {
      // Contar registros antes de apagar
      const preCount = await this.count()
      if (preCount > 0) {
        if (onProgress) onProgress(0, preCount, 'deleting')
        removidos = await this.clearAll((deleted, tot) => {
          if (onProgress) onProgress(deleted, tot, 'deleting')
        })
      }
    } else {
      // Modo upsert: pré-carregar códigos existentes
      try {
        const existingList = await pb
          .collection('cid10')
          .getFullList<{ id: string; codigo: string }>({
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
    }

    if (onProgress) onProgress(0, total, 'importing')

    // Processamento dos itens em chunks para concorrência segura sem estourar conexões do PocketBase
    const CONCURRENCY = 10
    let processedCount = 0

    for (let i = 0; i < total; i += CONCURRENCY) {
      const slice = items.slice(i, i + CONCURRENCY)

      await Promise.all(
        slice.map(async (row, sliceIdx) => {
          const linha = i + sliceIdx + 1
          const cod = (row.codigo || '').toString().trim().toUpperCase()
          const desc = (row.descricao || '').toString().trim()

          if (!cod || !desc) {
            erros.push({
              linha,
              codigo: cod || '(vazio)',
              erro: 'Código e Descrição são campos obrigatórios.',
            })
            return
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
            const existingId = mode === 'upsert' ? existingMap.get(cod) : undefined
            if (existingId) {
              await pb.collection('cid10').update(existingId, payload, { requestKey: null })
              atualizados++
            } else {
              try {
                const created = await pb.collection('cid10').create(payload, { requestKey: null })
                existingMap.set(cod, created.id)
                inseridos++
              } catch (createErr: any) {
                // Se der conflito de duplicidade de código no mesmo lote ou banco
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
        }),
      )

      processedCount = Math.min(i + CONCURRENCY, total)

      if (onProgress) {
        onProgress(processedCount, total, 'importing')
      }

      // Pequena pausa a cada 50 itens para ceder o event loop e não congelar a UI
      if (i % 50 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0))
      }
    }

    return { inseridos, atualizados, removidos, erros }
  },

  /**
   * Compatibilidade com implementações existentes
   */
  async upsertBatch(
    items: CidItemInput[],
    onProgress?: (processed: number, total: number) => void,
  ): Promise<CidUpsertResult> {
    return this.importBatch(items, 'upsert', (processed, total) => {
      if (onProgress) onProgress(processed, total)
    })
  },
}
