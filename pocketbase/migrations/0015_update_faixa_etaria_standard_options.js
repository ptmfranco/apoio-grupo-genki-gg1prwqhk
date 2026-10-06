migrate(
  (app) => {
    const benefCol = app.findCollectionByNameOrId('beneficiarios')

    // Valores padronizados de faixa etária: IDs de '01' a '10'
    const faixaValues = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']

    // 1. Atualizar ou adicionar o campo 'faixa' como SelectField com as 10 opções
    const existingFaixa = benefCol.fields.getByName('faixa')
    if (existingFaixa) {
      existingFaixa.type = 'select'
      existingFaixa.values = faixaValues
      existingFaixa.maxSelect = 1
    } else {
      benefCol.fields.add(
        new SelectField({
          name: 'faixa',
          values: faixaValues,
          maxSelect: 1,
        }),
      )
    }

    // Salvar schema atualizado
    app.save(benefCol)

    // 2. Normalizar dados existentes (se houver algum registro)
    // Mapeamentos para os IDs '01' a '10'
    try {
      app
        .db()
        .newQuery(`
        UPDATE beneficiarios
        SET faixa = CASE
          WHEN faixa IN ('01', '0 a 18 anos', '0-18', '10-14', '14-17') THEN '01'
          WHEN faixa IN ('02', '19 a 23 anos', '19-23', '18-24', '18-25', '20-24') THEN '02'
          WHEN faixa IN ('03', '24 a 28 anos', '24-28', '26-35') THEN '03'
          WHEN faixa IN ('04', '29 a 33 anos', '29-33', '30-34', '18-29') THEN '04'
          WHEN faixa IN ('05', '34 a 38 anos', '34-38', '35-39', '30-39') THEN '05'
          WHEN faixa IN ('06', '39 a 43 anos', '39-43', '40-44') THEN '06'
          WHEN faixa IN ('07', '44 a 48 anos', '44-48', '45-49', '48-52', '40-49') THEN '07'
          WHEN faixa IN ('08', '49 a 53 anos', '49-53', '50-54', '52-56') THEN '08'
          WHEN faixa IN ('09', '54 a 58 anos', '54-58', '55-59', '58-62', '50-59') THEN '09'
          WHEN faixa IN ('10', '59 anos ou mais', '59+', '60+', '60-64') THEN '10'
          ELSE '05'
        END
        WHERE faixa IS NOT NULL AND faixa != '';
      `)
        .execute()

      // Manter faixa_etaria sincronizado para retrocompatibilidade
      app
        .db()
        .newQuery(`
        UPDATE beneficiarios
        SET faixa_etaria = faixa
        WHERE faixa IS NOT NULL AND faixa != '';
      `)
        .execute()
    } catch (e) {
      console.log('Aviso ao normalizar faixas em beneficiarios:', e)
    }
  },
  (app) => {
    try {
      const benefCol = app.findCollectionByNameOrId('beneficiarios')
      const existingFaixa = benefCol.fields.getByName('faixa')
      if (existingFaixa) {
        existingFaixa.type = 'text'
        delete existingFaixa.values
        delete existingFaixa.maxSelect
        app.save(benefCol)
      }
    } catch (_) {}
  },
)
