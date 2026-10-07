migrate(
  (app) => {
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    // 1. Corrigir maxSelect do campo 'perfil' se foi alterado para > 1
    const perfilField = users.fields.getByName('perfil')
    if (perfilField) {
      perfilField.maxSelect = 1
      if (!perfilField.values.includes('SUPERUSUARIO')) {
        perfilField.values = [...perfilField.values, 'SUPERUSUARIO']
      }
    }

    // 2. Corrigir regras de acesso para suportar tanto role='admin' quanto perfil contendo SUPERUSUARIO
    // Em PocketBase, quando perfil é um select field (ou array), @request.auth.perfil ?= 'SUPERUSUARIO'
    // ou @request.auth.perfil = 'SUPERUSUARIO' ou @request.auth.perfil ~ 'SUPERUSUARIO'.
    // Usamos:
    // (@request.auth.role = 'admin' || @request.auth.perfil ?= 'SUPERUSUARIO' || @request.auth.perfil ~ 'SUPERUSUARIO' || @request.auth.perfil = 'SUPERUSUARIO')
    // E para update, o próprio usuário pode atualizar seu registro: id = @request.auth.id
    const superCondition =
      "@request.auth.role = 'admin' || @request.auth.perfil ?= 'SUPERUSUARIO' || @request.auth.perfil ~ 'SUPERUSUARIO' || @request.auth.perfil = 'SUPERUSUARIO'"

    users.createRule = `@request.auth.id != '' && (${superCondition})`
    users.updateRule = `@request.auth.id != '' && (${superCondition} || id = @request.auth.id)`
    users.deleteRule = `@request.auth.id != '' && (${superCondition})`

    app.save(users)

    // Também corrigir maxSelect em config_lgpd_campos e dashboard_cache caso tenham sido afetados
    try {
      const configLgpdCol = app.findCollectionByNameOrId('config_lgpd_campos')
      const lgpdPerfil = configLgpdCol.fields.getByName('perfil')
      if (lgpdPerfil) {
        lgpdPerfil.maxSelect = 1
        app.save(configLgpdCol)
      }
    } catch (_) {}

    try {
      const dashCol = app.findCollectionByNameOrId('dashboard_cache')
      const dashPerfil = dashCol.fields.getByName('perfil')
      if (dashPerfil) {
        dashPerfil.maxSelect = 1
        app.save(dashCol)
      }
    } catch (_) {}
  },
  (app) => {
    // Reversão
  },
)
