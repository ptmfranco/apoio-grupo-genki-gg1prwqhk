migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // 1. Atualizar valores do select 'perfil' na coleção users (_pb_users_auth_)
    // -------------------------------------------------------------------------
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    const perfilField = users.fields.getByName('perfil')
    if (perfilField) {
      const currentValues = perfilField.values || []
      if (!currentValues.includes('SUPERUSUARIO')) {
        perfilField.values = [...currentValues, 'SUPERUSUARIO']
        perfilField.maxSelect = perfilField.values.length
      }
    }

    // Regras de acesso da coleção users:
    // Apenas SUPERUSUARIO ou admin podem criar usuários (e criação anônima desabilitada para restringir estritamente)
    // createRule: apenas SUPERUSUARIO (ou admin) autenticado
    users.createRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.perfil = 'SUPERUSUARIO')"

    // updateRule: admin, SUPERUSUARIO, ou o próprio usuário atualizando seus dados (ex: tema_preferido)
    users.updateRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.perfil = 'SUPERUSUARIO' || id = @request.auth.id)"

    // deleteRule: apenas admin ou SUPERUSUARIO
    users.deleteRule =
      "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.perfil = 'SUPERUSUARIO')"

    app.save(users)

    // -------------------------------------------------------------------------
    // 2. Atualizar campo 'perfil' em config_lgpd_campos e dashboard_cache
    // -------------------------------------------------------------------------
    try {
      const configLgpdCol = app.findCollectionByNameOrId('config_lgpd_campos')
      const lgpdPerfilField = configLgpdCol.fields.getByName('perfil')
      if (lgpdPerfilField && !lgpdPerfilField.values.includes('SUPERUSUARIO')) {
        lgpdPerfilField.values = [...lgpdPerfilField.values, 'SUPERUSUARIO']
        lgpdPerfilField.maxSelect = lgpdPerfilField.values.length
        app.save(configLgpdCol)
      }
    } catch (e) {
      console.log('Aviso ao atualizar config_lgpd_campos perfil:', e)
    }

    try {
      const dashCol = app.findCollectionByNameOrId('dashboard_cache')
      const dashPerfilField = dashCol.fields.getByName('perfil')
      if (dashPerfilField && !dashPerfilField.values.includes('SUPERUSUARIO')) {
        dashPerfilField.values = [...dashPerfilField.values, 'SUPERUSUARIO']
        dashPerfilField.maxSelect = dashPerfilField.values.length
        app.save(dashCol)
      }
    } catch (e) {
      console.log('Aviso ao atualizar dashboard_cache perfil:', e)
    }

    // -------------------------------------------------------------------------
    // 3. Cadastrar ou atualizar conta do SUPERUSUARIO
    // -------------------------------------------------------------------------
    const superEmail = 'superusuario@venart.com.br'
    const superPassword = 'Apo!Genki#Su6-2026'

    let superUser
    try {
      superUser = app.findAuthRecordByEmail('_pb_users_auth_', superEmail)
    } catch (_) {
      superUser = new Record(users)
    }

    superUser.setEmail(superEmail)
    superUser.setPassword(superPassword)
    superUser.setVerified(true)
    superUser.set('name', 'Super Usuário (Administrador)')
    superUser.set('perfil', 'SUPERUSUARIO')
    superUser.set('tema_preferido', 'LIGHT')
    superUser.set('categoria_profissional', 'ADMINISTRATIVO')
    superUser.set('registro_profissional', 'SUPER-001')
    superUser.set('unidade_regiao', 'São Paulo')
    superUser.set('ativo', true)
    app.save(superUser)

    // -------------------------------------------------------------------------
    // 4. Configurar regras LGPD padrão para SUPERUSUARIO em config_lgpd_campos
    // -------------------------------------------------------------------------
    try {
      const configLgpdCol = app.findCollectionByNameOrId('config_lgpd_campos')
      const campos = [
        { campo: 'nome', visivel: false },
        { campo: 'condicao_principal', visivel: true },
        { campo: 'risco', visivel: true },
        { campo: 'custo_12m', visivel: true },
      ]
      const now = new Date().toISOString()
      for (const item of campos) {
        let rec
        try {
          const found = app.findRecordsByFilter(
            'config_lgpd_campos',
            `perfil = 'SUPERUSUARIO' && campo = '${item.campo}'`,
            '',
            1,
            0,
          )
          if (found && found.length > 0) {
            rec = found[0]
          } else {
            rec = new Record(configLgpdCol)
          }
        } catch (_) {
          rec = new Record(configLgpdCol)
        }
        rec.set('perfil', 'SUPERUSUARIO')
        rec.set('campo', item.campo)
        rec.set('visivel', item.visivel)
        rec.set('atualizado_por', superUser.id)
        rec.set('atualizado_em', now)
        app.save(rec)
      }
    } catch (e) {
      console.log('Aviso ao inicializar config_lgpd_campos para SUPERUSUARIO:', e)
    }
  },
  (app) => {
    // Reversão
    try {
      const superUser = app.findAuthRecordByEmail('_pb_users_auth_', 'superusuario@venart.com.br')
      app.delete(superUser)
    } catch (_) {}

    try {
      const users = app.findCollectionByNameOrId('_pb_users_auth_')
      users.createRule = "@request.auth.id != '' || @request.auth.id = ''"
      users.updateRule =
        "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.perfil = 'GESTOR_VENART' || @request.auth.perfil = 'GESTOR_PROGRAMA' || @request.auth.perfil = 'GESTOR_RH' || @request.auth.perfil = 'OPERACAO' || id = @request.auth.id)"
      app.save(users)
    } catch (_) {}
  },
)
