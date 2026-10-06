migrate(
  (app) => {
    // 1. Criar coleção cid10
    let cidCol
    try {
      cidCol = app.findCollectionByNameOrId('cid10')
    } catch (_) {
      cidCol = new Collection({
        name: 'cid10',
        type: 'base',
        listRule: "@request.auth.id != ''",
        viewRule: "@request.auth.id != ''",
        createRule: "@request.auth.id != ''",
        updateRule: "@request.auth.id != ''",
        deleteRule: "@request.auth.id != ''",
        fields: [
          {
            name: 'codigo',
            type: 'text',
            required: true,
          },
          {
            name: 'descricao',
            type: 'text',
            required: true,
          },
          {
            name: 'capitulo',
            type: 'text',
          },
          {
            name: 'grupo',
            type: 'text',
          },
          {
            name: 'categoria',
            type: 'text',
          },
          {
            name: 'subcategoria',
            type: 'text',
          },
          {
            name: 'ativo',
            type: 'bool',
          },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
          { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_cid10_codigo ON cid10 (codigo)',
          'CREATE INDEX idx_cid10_descricao ON cid10 (descricao)',
          'CREATE INDEX idx_cid10_ativo ON cid10 (ativo)',
        ],
      })
      app.save(cidCol)
    }

    // 2. Garantir campos telefone e celular na coleção beneficiarios
    // Não marcamos required no banco para preservar compatibilidade com registros legados
    try {
      const benefCol = app.findCollectionByNameOrId('beneficiarios')
      let changed = false

      if (!benefCol.fields.getByName('telefone')) {
        benefCol.fields.add(
          new TextField({
            name: 'telefone',
            required: false,
          }),
        )
        changed = true
      }

      if (!benefCol.fields.getByName('celular')) {
        benefCol.fields.add(
          new TextField({
            name: 'celular',
            required: false,
          }),
        )
        changed = true
      }

      if (changed) {
        app.save(benefCol)
      }
    } catch (e) {
      console.log('Aviso ao verificar campos telefone/celular em beneficiarios:', e)
    }
  },
  (app) => {
    try {
      const cidCol = app.findCollectionByNameOrId('cid10')
      app.delete(cidCol)
    } catch (_) {}
  },
)
