migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // 1. Atualizar senhas dos 5 usuários VenArt para senhas fortes de produção
    // -------------------------------------------------------------------------
    const userCredentials = [
      {
        email: 'mateus.martins@venart.com.br',
        newPassword: 'Apo!Genki#Mm7-2026',
      },
      {
        email: 'larissa.alquati@venart.com.br',
        newPassword: 'Apo!Genki#La8-2026',
      },
      {
        email: 'toshio.oba@venart.com.br',
        newPassword: 'Apo!Genki#To9-2026',
      },
      {
        email: 'raul.mazia@venart.com.br',
        newPassword: 'Apo!Genki#Rm4-2026',
      },
      {
        email: 'ketlin.nazario@venart.com.br',
        newPassword: 'Apo!Genki#Kn5-2026',
      },
    ]

    for (const cred of userCredentials) {
      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', cred.email)
        user.setPassword(cred.newPassword)
        user.setVerified(true)
        user.set('ativo', true)
        app.save(user)
      } catch (err) {
        console.log(`Usuário não encontrado ou erro ao atualizar senha: ${cred.email}`, err)
      }
    }
  },
  (app) => {
    // Reversão para senha padrão anterior caso necessário em rollback
    const fallbackEmails = [
      'mateus.martins@venart.com.br',
      'larissa.alquati@venart.com.br',
      'toshio.oba@venart.com.br',
      'raul.mazia@venart.com.br',
      'ketlin.nazario@venart.com.br',
    ]

    for (const email of fallbackEmails) {
      try {
        const user = app.findAuthRecordByEmail('_pb_users_auth_', email)
        user.setPassword('12345678')
        app.save(user)
      } catch (_) {}
    }
  },
)
