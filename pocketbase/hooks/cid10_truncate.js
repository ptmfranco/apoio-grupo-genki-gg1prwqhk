/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook dedicado para truncar/limpar a coleção cid10 de forma atômica e rápida
 * sem remover questionários clínicos nem outras coleções operacionais.
 */
routerAdd(
  'POST',
  '/backend/v1/cid10/truncate',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { message: 'Não autorizado. Autenticação necessária.' })
    }

    const perfil = authRecord.getString('perfil') || ''
    const role = authRecord.getString('role') || ''
    const isAllowed =
      perfil === 'SUPERUSUARIO' ||
      perfil === 'GESTOR_VENART' ||
      role === 'admin' ||
      role === 'gestor'

    if (!isAllowed) {
      return e.json(403, {
        message: 'Acesso negado. Apenas gestores podem limpar o catálogo de CID-10.',
      })
    }

    try {
      const col = $app.findCollectionByNameOrId('cid10')
      $app.truncateCollection(col)
      return e.json(200, { success: true, message: 'Catálogo de CID-10 limpo com sucesso.' })
    } catch (err) {
      return e.json(500, {
        message: 'Erro ao limpar coleção CID-10.',
        error: String(err),
      })
    }
  },
  $apis.requireAuth(),
)
