migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // Atualização das credenciais dos 5 usuários principais (idempotente)
    // -------------------------------------------------------------------------
    const targetUsers = [
      {
        lookupEmails: ['matheus.martins@venart.com.br', 'mateus.martins@venart.com.br'],
        finalEmail: 'matheus.martins@venart.com.br',
        password: 'Apo!Genki#Mm7-2026',
        name: 'Mateus Martins',
      },
      {
        lookupEmails: ['toshio.oba@venart.com.br'],
        finalEmail: 'toshio.oba@venart.com.br',
        password: 'Apo!Genki#Mm9-2026',
        name: 'Dr Toshio Oba',
      },
      {
        lookupEmails: ['ketlin.nazario@venart.com.br'],
        finalEmail: 'ketlin.nazario@venart.com.br',
        password: 'Apo!Genki#Kn5-2026',
        name: 'Ketlin Nazário',
      },
      {
        lookupEmails: ['larissa.alquati@venart.com.br'],
        finalEmail: 'larissa.alquati@venart.com.br',
        password: 'Apo!Genki#La8-2026',
        name: 'Larissa Alquati',
      },
      {
        lookupEmails: ['raul.mazia@adama.com.br', 'raul.mazia@venart.com.br'],
        finalEmail: 'raul.mazia@adama.com.br',
        password: 'Apo!Genki#Rm4-2026',
        name: 'Raul Mazia',
      },
    ]

    for (const item of targetUsers) {
      let user = null
      for (const email of item.lookupEmails) {
        try {
          user = app.findAuthRecordByEmail('_pb_users_auth_', email)
          if (user) break
        } catch (_) {}
      }

      if (!user) {
        try {
          const records = app.findRecordsByFilter(
            '_pb_users_auth_',
            `name = '${item.name}'`,
            '',
            1,
            0,
          )
          if (records && records.length > 0) {
            user = records[0]
          }
        } catch (_) {}
      }

      if (user) {
        user.setEmail(item.finalEmail)
        user.setPassword(item.password)
        user.setVerified(true)
        user.set('ativo', true)
        app.save(user)
      } else {
        console.log(`Usuário não encontrado para atualizar credenciais: ${item.finalEmail}`)
      }
    }
  },
  (app) => {
    // Rollback para senhas anteriores caso necessário
    const revertUsers = [
      { email: 'matheus.martins@venart.com.br', pass: 'Apo!Genki#Mm7-2026' },
      { email: 'toshio.oba@venart.com.br', pass: 'Apo!Genki#To9-2026' },
      { email: 'ketlin.nazario@venart.com.br', pass: 'Apo!Genki#Kn5-2026' },
      { email: 'larissa.alquati@venart.com.br', pass: 'Apo!Genki#La8-2026' },
      { email: 'raul.mazia@adama.com.br', pass: 'Apo!Genki#Rm4-2026' },
    ]
    for (const item of revertUsers) {
      try {
        const u = app.findAuthRecordByEmail('_pb_users_auth_', item.email)
        u.setPassword(item.pass)
        app.save(u)
      } catch (_) {}
    }
  },
)
