/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para atualização de usuários por SUPERUSUARIO ou pelo próprio usuário.
 *
 * No PocketBase, coleções do tipo 'auth' exigem 'oldPassword' quando uma requisição
 * não-admin tenta alterar o e-mail ou a senha de um usuário. Como o SUPERUSUARIO
 * é autenticado via users (perfil SUPERUSUARIO) e precisa redefinir senhas ou atualizar
 * e-mails sem conhecer a senha atual do colaborador, interceptamos a requisição
 * no onRecordUpdateRequest('users') ou fornecemos rota dedicada.
 *
 * No hook onRecordUpdateRequest:
 * - Se o chamador autenticado for SUPERUSUARIO:
 *   PocketBase aplica as validações de oldPassword se os campos 'email' ou 'password'
 *   estiverem no body da requisição pública de usuário comum.
 *   Para contornar com total segurança e sem exigir oldPassword:
 *   se o body contiver 'password' / 'email', e o auth for SUPERUSUARIO,
 *   podemos aplicar as alterações via $app com privilégios de sistema ou tratar os campos.
 */

onRecordUpdateRequest((e) => {
  const authRecord = e.auth
  if (!authRecord) {
    return e.next()
  }

  const isSuperUser =
    authRecord.getString('perfil') === 'SUPERUSUARIO' || authRecord.getString('role') === 'admin'

  const targetRecord = e.record
  const isSelf = authRecord.id === targetRecord.id

  // Se não for superusuario nem o próprio usuário, o updateRule do PocketBase cuidará
  // Se for SUPERUSUARIO editando outro usuário (ou a si mesmo):
  // O PocketBase exige oldPassword se password ou email forem enviados em requisições de non-superusers.
  // Podemos inspecionar os dados enviados:
  const body = e.requestInfo().body || {}
  const targetEmail = body.email ? String(body.email).trim().toLowerCase() : ''
  const currentEmail = targetRecord.email()
  const emailChanged = targetEmail !== '' && targetEmail !== currentEmail.toLowerCase()

  const newPassword = body.password ? String(body.password).trim() : ''
  const passwordConfirm = body.passwordConfirm ? String(body.passwordConfirm).trim() : ''

  // Se for SUPERUSUARIO e houver alteração de senha ou de e-mail em outro usuário:
  if (isSuperUser && !isSelf) {
    // Se o super usuário está definindo uma nova senha para outro usuário
    if (newPassword) {
      if (newPassword.length < 8) {
        throw new BadRequestError('A nova senha deve ter no mínimo 8 caracteres.')
      }
      if (passwordConfirm && newPassword !== passwordConfirm) {
        throw new BadRequestError('A confirmação de senha não confere.')
      }
      targetRecord.setPassword(newPassword)
    }

    // Se o super usuário está alterando o e-mail de outro usuário
    if (emailChanged) {
      targetRecord.setEmail(targetEmail)
    }

    // Remover password e email do body / requisição para que o validador padrão de auth
    // do PocketBase não exija oldPassword
    // No PocketBase Goja runtime, e.record já tem as alterações setadas via setPassword/setEmail.
    // Limpar os campos do payload que disparam a checagem de oldPassword:
    if (body.password !== undefined) {
      delete body.password
    }
    if (body.passwordConfirm !== undefined) {
      delete body.passwordConfirm
    }
    if (body.oldPassword !== undefined) {
      delete body.oldPassword
    }
    if (!emailChanged && body.email !== undefined) {
      // Se não mudou, remove para não disparar validação de e-mail do auth record
      delete body.email
    }
  } else if (isSuperUser && isSelf) {
    // Super usuário editando a si mesmo:
    // Se não enviou senha nova nem mudou e-mail, limpar campos vazios para não disparar validação
    if (!newPassword && body.password !== undefined) {
      delete body.password
    }
    if (!newPassword && body.passwordConfirm !== undefined) {
      delete body.passwordConfirm
    }
    if (!emailChanged && body.email !== undefined) {
      delete body.email
    }
  } else {
    // Usuário comum editando a si mesmo:
    if (!newPassword && body.password !== undefined) {
      delete body.password
    }
    if (!newPassword && body.passwordConfirm !== undefined) {
      delete body.passwordConfirm
    }
    if (!emailChanged && body.email !== undefined) {
      delete body.email
    }
  }

  return e.next()
}, 'users')
