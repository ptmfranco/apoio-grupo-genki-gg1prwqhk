/// <reference path="../pb_data/types.d.ts" />

/**
 * Hook para atualização e redefinição de credenciais de usuários pelo SUPERUSUARIO.
 *
 * No PocketBase, requisições diretas de update na coleção 'users' (_pb_users_auth_)
 * exigem 'oldPassword' sempre que os campos 'email', 'password' ou 'passwordConfirm'
 * são enviados no corpo da requisição e o chamador não é um superuser nativo do PocketBase.
 * Como o SUPERUSUARIO do sistema é autenticado na coleção users (perfil = 'SUPERUSUARIO'),
 * interceptamos a requisição antes da validação nativa:
 * - Se for SUPERUSUARIO editando OUTRO usuário:
 *   permite trocar e-mail e senha sem exigir oldPassword.
 * - Se o usuário estiver editando a si mesmo:
 *   mantém a exigência do PocketBase de oldPassword caso esteja alterando e-mail ou senha.
 * - Limpa campos vazios e e-mails inalterados para evitar erros espúrios de validação.
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

  const body = e.requestInfo().body || {}
  const rawEmail =
    body.email !== undefined && body.email !== null ? String(body.email).trim().toLowerCase() : ''
  const currentEmail = (targetRecord.email() || '').trim().toLowerCase()
  const emailChanged = rawEmail !== '' && rawEmail !== currentEmail

  const rawPassword =
    body.password !== undefined && body.password !== null ? String(body.password).trim() : ''
  const rawPasswordConfirm =
    body.passwordConfirm !== undefined && body.passwordConfirm !== null
      ? String(body.passwordConfirm).trim()
      : ''
  const hasNewPassword = rawPassword.length > 0

  // 1. SUPERUSUARIO editando OUTRO usuário:
  // Permitir redefinição de e-mail e senha sem exigir oldPassword.
  if (isSuperUser && !isSelf) {
    if (hasNewPassword) {
      if (rawPassword.length < 8) {
        throw new BadRequestError('A nova senha deve ter no mínimo 8 caracteres.')
      }
      if (rawPasswordConfirm && rawPassword !== rawPasswordConfirm) {
        throw new BadRequestError('A confirmação de nova senha não confere.')
      }
      targetRecord.setPassword(rawPassword)
    }

    if (emailChanged) {
      targetRecord.setEmail(rawEmail)
    }

    // Remove do body para que a continuidade do pipeline de update nativo do PB
    // não tente validar oldPassword nem acuse discrepância
    delete body.password
    delete body.passwordConfirm
    delete body.oldPassword
    delete body.email
  } else {
    // 2. Edição de si mesmo ou outro usuário comum:
    // Se não informou nova senha, remover password/passwordConfirm vazios do body
    if (!hasNewPassword) {
      delete body.password
      delete body.passwordConfirm
      if (body.oldPassword !== undefined && !body.oldPassword) {
        delete body.oldPassword
      }
    }
    // Se o e-mail não foi alterado, remover do body para não disparar "Values don't match" ou oldPassword
    if (!emailChanged && body.email !== undefined) {
      delete body.email
    }
  }

  return e.next()
}, 'users')
