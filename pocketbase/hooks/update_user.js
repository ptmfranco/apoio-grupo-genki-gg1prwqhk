/// <reference path="../pb_data/types.d.ts" />

/**
 * Endpoint para que o SUPERUSUARIO possa redefinir senha e atualizar dados de qualquer usuário
 * sem a exigência de 'oldPassword'.
 */

routerAdd(
  'POST',
  '/backend/v1/users/{id}/update',
  (e) => {
    const authRecord = e.auth
    if (!authRecord) {
      return e.json(401, { message: 'Não autorizado. Autenticação necessária.' })
    }

    const isSuperUser =
      authRecord.getString('perfil') === 'SUPERUSUARIO' || authRecord.getString('role') === 'admin'

    const targetId = e.request.pathValue('id')
    const isSelf = authRecord.id === targetId

    if (!isSuperUser && !isSelf) {
      return e.json(403, {
        message: 'Acesso negado. Apenas o Super Usuário pode editar outros usuários.',
      })
    }

    let targetRecord
    try {
      targetRecord = $app.findRecordById('users', targetId)
    } catch (_) {
      return e.json(404, { message: 'Usuário não encontrado.' })
    }

    const body = e.requestInfo().body || {}

    // 1. Atualizar campos básicos se fornecidos
    if (body.name !== undefined) {
      targetRecord.set('name', String(body.name).trim())
    }

    if (body.perfil !== undefined && isSuperUser) {
      targetRecord.set('perfil', String(body.perfil).trim())
    }

    if (body.tipo_profissional !== undefined) {
      const tipo = String(body.tipo_profissional).trim()
      targetRecord.set('tipo_profissional', tipo === 'ENFERMEIRO' || tipo === 'MEDICO' ? tipo : '')
    }

    if (body.categoria_profissional !== undefined) {
      targetRecord.set('categoria_profissional', String(body.categoria_profissional).trim())
    }

    if (body.registro_profissional !== undefined) {
      targetRecord.set('registro_profissional', String(body.registro_profissional).trim())
    }

    if (body.unidade_regiao !== undefined) {
      targetRecord.set('unidade_regiao', String(body.unidade_regiao).trim())
    }

    if (body.tema_preferido !== undefined) {
      targetRecord.set('tema_preferido', body.tema_preferido === 'DARK' ? 'DARK' : 'LIGHT')
    }

    if (body.ativo !== undefined && isSuperUser) {
      targetRecord.set('ativo', Boolean(body.ativo))
    }

    // 2. E-mail: apenas se fornecido e válido
    if (body.email !== undefined) {
      const newEmail = String(body.email).trim().toLowerCase()
      if (newEmail && newEmail !== (targetRecord.email() || '').toLowerCase()) {
        targetRecord.setEmail(newEmail)
      }
    }

    // Sempre garantir visibilidade do e-mail para que a listagem de usuários exiba o valor
    targetRecord.setEmailVisibility(true)

    // 3. Senha: se fornecida
    if (body.password !== undefined && String(body.password).trim() !== '') {
      const newPass = String(body.password).trim()
      if (newPass.length < 8) {
        return e.json(400, {
          message: 'Validação falhou.',
          data: { password: { message: 'A nova senha deve ter no mínimo 8 caracteres.' } },
        })
      }
      if (body.passwordConfirm !== undefined && String(body.passwordConfirm).trim() !== newPass) {
        return e.json(400, {
          message: 'Validação falhou.',
          data: { passwordConfirm: { message: 'A confirmação de nova senha não confere.' } },
        })
      }
      // Se for o próprio usuário (não superusuário editando outro), exigir oldPassword
      if (isSelf && !isSuperUser) {
        const oldPass = body.oldPassword ? String(body.oldPassword).trim() : ''
        if (!oldPass) {
          return e.json(400, {
            message: 'Validação falhou.',
            data: { oldPassword: { message: 'Informe a senha atual para alteração de senha.' } },
          })
        }
        if (!targetRecord.validatePassword(oldPass)) {
          return e.json(400, {
            message: 'Validação falhou.',
            data: { oldPassword: { message: 'Senha atual incorreta.' } },
          })
        }
      }
      targetRecord.setPassword(newPass)
    }

    try {
      $app.save(targetRecord)
    } catch (saveErr) {
      return e.json(400, {
        message: 'Erro ao salvar usuário.',
        error: String(saveErr),
      })
    }

    return e.json(200, targetRecord)
  },
  $apis.requireAuth(),
)
