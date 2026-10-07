migrate(
  (app) => {
    // 1) LGPD: Para GESTOR_VENART, GESTOR_PROGRAMA e SUPERUSUARIO, definir visivel = true para campo = 'nome'
    // Para GESTOR_RH e OPERACAO, manter visivel = false
    const configLgpdCol = app.findCollectionByNameOrId('config_lgpd_campos')

    // Obter um usuário admin/superusuário para registrar atualizado_por
    let adminUserId = ''
    try {
      const superUser = app.findAuthRecordByEmail('_pb_users_auth_', 'super@genki.com.br')
      adminUserId = superUser.id
    } catch (_) {
      try {
        const adminUser = app.findAuthRecordByEmail(
          '_pb_users_auth_',
          'mateus.martins@venart.com.br',
        )
        adminUserId = adminUser.id
      } catch (_) {
        try {
          const fallback = app.findAuthRecordByEmail('_pb_users_auth_', 'paulotmfranco@gmail.com')
          adminUserId = fallback.id
        } catch (_) {}
      }
    }

    const now = new Date().toISOString()

    const regras = [
      { perfil: 'GESTOR_VENART', campo: 'nome', visivel: true },
      { perfil: 'GESTOR_PROGRAMA', campo: 'nome', visivel: true },
      { perfil: 'SUPERUSUARIO', campo: 'nome', visivel: true },
      { perfil: 'GESTOR_RH', campo: 'nome', visivel: false },
      { perfil: 'OPERACAO', campo: 'nome', visivel: false },
    ]

    for (const regra of regras) {
      let rec
      try {
        const found = app.findRecordsByFilter(
          'config_lgpd_campos',
          `perfil = '${regra.perfil}' && campo = '${regra.campo}'`,
          '',
          1,
          0,
        )
        if (found && found.length > 0) {
          rec = found[0]
        } else {
          rec = new Record(configLgpdCol)
          rec.set('perfil', regra.perfil)
          rec.set('campo', regra.campo)
        }
      } catch (_) {
        rec = new Record(configLgpdCol)
        rec.set('perfil', regra.perfil)
        rec.set('campo', regra.campo)
      }

      rec.set('visivel', regra.visivel)
      if (adminUserId) {
        rec.set('atualizado_por', adminUserId)
      }
      rec.set('atualizado_em', now)
      app.save(rec)
    }
  },
  (app) => {
    // Reverter GESTOR_VENART, GESTOR_PROGRAMA e SUPERUSUARIO para visivel = false no campo nome
    const perfis = ['GESTOR_VENART', 'GESTOR_PROGRAMA', 'SUPERUSUARIO']
    for (const perfil of perfis) {
      try {
        const found = app.findRecordsByFilter(
          'config_lgpd_campos',
          `perfil = '${perfil}' && campo = 'nome'`,
          '',
          1,
          0,
        )
        if (found && found.length > 0) {
          const rec = found[0]
          rec.set('visivel', false)
          app.save(rec)
        }
      } catch (_) {}
    }
  },
)
