migrate(
  (app) => {
    // 1. Atualizar todos os usuários existentes para emailVisibility = true
    // No PocketBase auth collections, o campo booleano emailVisibility controla se o e-mail
    // é retornado em listagens/consultas via API para outros usuários autenticados.
    app.db().newQuery('UPDATE users SET emailVisibility = 1').execute()
  },
  (app) => {
    // Reversão
  },
)
