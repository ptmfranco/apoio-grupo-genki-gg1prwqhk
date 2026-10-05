migrate(
  (app) => {
    // -------------------------------------------------------------------------
    // Atualização clínica aprofundada dos 10 templates de questionários
    // Diretrizes clínicas de referência: SBD, SBC, GOLD, GINA, FEBRASGO, APA
    // Requisitos: 6 a 10 questões por template, tipos válidos, obrigatórias nas essenciais,
    // atualização nos templates existentes por condicao_principal.
    // -------------------------------------------------------------------------
    const templatesCol = app.findCollectionByNameOrId('questionarios_templates')

    const updatedProtocols = [
      // 1. Diabetes Mellitus (SBD / ADA)
      {
        condicao_principal: 'Diabetes Mellitus',
        titulo: 'Protocolo de Acompanhamento Clínico — Diabetes Mellitus',
        descricao:
          'Monitoramento glicêmico, adesão farmacológica, rastreamento de hipoglicemias, neuropatia periférica e prevenção cardiovascular.',
        questoes: [
          {
            id: 'dm_1',
            enunciado:
              'Qual o valor da Hemoglobina Glicada (HbA1c) mais recente realizada nos últimos 90 dias?',
            tipo: 'texto_livre',
            obrigatoria: true,
            placeholder: 'Ex: 7.1% (exame em 15/02/2026)',
          },
          {
            id: 'dm_2',
            enunciado:
              'Frequência de episódios de hipoglicemia (glicemia < 70 mg/dL, tremores, sudorese, confusão ou tontura) no último mês:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Nenhum episódio no mês',
              '1 a 2 episódios leves (autocorrige com glicose)',
              '1 ou mais episódios por semana',
              'Episódios graves com necessidade de auxílio de terceiros',
            ],
          },
          {
            id: 'dm_3',
            enunciado:
              'Adesão ao tratamento medicamentoso prescrito (insulina e/ou antidiabéticos orais):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Não toma ou interrompeu',
            legendaMax: '5 = Uso 100% correto nos horários e doses',
          },
          {
            id: 'dm_4',
            enunciado:
              'Realiza automonitorização da glicemia capilar ou monitor contínuo (sensor) conforme a frequência pactuada?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'dm_5',
            enunciado:
              'Exame e sensibilidade dos pés: apresenta feridas, calosidades com fissuras, dormência, queimação ou perda de sensibilidade tátil?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'dm_6',
            enunciado:
              'Adesão ao plano alimentar individualizado (controle de carboidratos simples, horários regulares e hidratação):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Sem adesão / Consumo descontrolado',
            legendaMax: '5 = Plano nutricional rigorosamente seguido',
          },
          {
            id: 'dm_7',
            enunciado:
              'Realizou consulta oftalmológica com mapeamento de retina / fundo de olho nos últimos 12 meses?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'dm_8',
            enunciado:
              'Prática de atividade física estruturada nos últimos 30 dias (meta: 150 min/semana):',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Sedentário (menos de 30 min/semana)',
              'Leve (30 a 90 min/semana)',
              'Moderada (90 a 150 min/semana)',
              'Adequada (150 min ou mais por semana)',
            ],
          },
          {
            id: 'dm_9',
            enunciado:
              'Observações clínicas do Concierge, metas pactuadas e encaminhamentos multiprofissionais:',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Metas de glicemia em jejum e pós-prandial, reavaliação de insulina, reforço de autocuidado...',
          },
        ],
      },

      // 2. Hipertensão Arterial (SBC / ESC)
      {
        condicao_principal: 'Hipertensão Arterial',
        titulo: 'Protocolo de Monitoramento Pressórico — Hipertensão Arterial Sistêmica',
        descricao:
          'Acompanhamento dos níveis tensionais, adesão a anti-hipertensivos, rastreamento de lesões em órgãos-alvo e consumo de sódio.',
        questoes: [
          {
            id: 'ha_1',
            enunciado:
              'Qual a média das aferições de Pressão Arterial (PA) nos últimos 7 dias (Sistólica x Diastólica)?',
            tipo: 'texto_livre',
            obrigatoria: true,
            placeholder: 'Ex: 128x82 mmHg (aferido com aparelho de braço calibrado)',
          },
          {
            id: 'ha_2',
            enunciado:
              'Apresentou sintomas de alerta para descompensação pressórica (cefaleia occipital, visão turva, zumbido, dor precordial ou dispneia)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ha_3',
            enunciado:
              'Adesão ao tratamento anti-hipertensivo prescrito (tomada diária sem omissão de doses):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Esquece constantemente',
            legendaMax: '5 = Adesão absoluta sem falhas',
          },
          {
            id: 'ha_4',
            enunciado:
              'Possui tensiômetro digital de braço validado em domicílio e realiza medições de acordo com a orientação?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ha_5',
            enunciado:
              'Frequência de aferição domiciliar da pressão arterial (MRPA/automonitoramento):',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Diária (manhã e noite)',
              '2 a 3 vezes por semana em horários alternados',
              'Apenas quando manifesta sintomas de cefaleia ou mal-estar',
              'Raramente ou nunca afere em casa',
            ],
          },
          {
            id: 'ha_6',
            enunciado:
              'Controle na ingestão de sódio, consumo de sal de cozinha e alimentos ultraprocessados:',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Alto consumo de sal e embutidos',
            legendaMax: '5 = Dieta hipossódica rigorosa (< 2g sódio/dia)',
          },
          {
            id: 'ha_7',
            enunciado:
              'Uso concomitante de substâncias hipertensogênicas (anti-inflamatórios não esteroidais, descongestionantes nasais, álcool excessivo ou energéticos)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ha_8',
            enunciado:
              'Condutas clínicas pactuadas, orientação sobre metas de PA (< 130/80 mmHg) e retorno agendado:',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Orientações sobre diuréticos pela manhã, monitoramento e ajuste de dose com médico de referência...',
          },
        ],
      },

      // 3. Lombalgia Crônica (Diretrizes de Reabilitação / EVA / Oswestry)
      {
        condicao_principal: 'Lombalgia Crônica',
        titulo: 'Protocolo de Avaliação de Coluna e Reabilitação — Lombalgia Crônica',
        descricao:
          'Graduação da intensidade dolorosa (EVA), sinais de alerta neurológicos, incapacidade funcional e ergonomia.',
        questoes: [
          {
            id: 'lc_1',
            enunciado:
              'Intensidade média da dor lombar nos últimos 7 dias (Escala Visual Analógica - EVA 0 a 5):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Nenhuma dor',
            legendaMax: '5 = Dor incapacitante máxima',
          },
          {
            id: 'lc_2',
            enunciado:
              'A dor lombar irradia abaixo do joelho, para o glúteo ou pé (ciatalgia, parestesia ou sensação de choque)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'lc_3',
            enunciado:
              'Sinais de alerta para compressão medular / Síndrome da Cauda Equina (perda de força nas pernas, retenção ou incontinência urinária/fecal, anestesia em sela)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'lc_4',
            enunciado:
              'Grau de limitação funcional nas atividades diárias e laborais provocada pela dor na coluna:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Sem limitação: realiza todas as atividades sem restrições',
              'Limitação leve: trabalha normalmente mas com desconforto em posturas prolongadas',
              'Limitação moderada: dificuldade para levantar peso, sentar ou caminhar',
              'Limitação severa: incapacidade funcional com impacto profissional e absenteísmo',
            ],
          },
          {
            id: 'lc_5',
            enunciado:
              'Engajamento no programa de exercícios terapêuticos (fisioterapia motora, RPG, pilates clínico ou fortalecimento do core):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Nenhum exercício / Imobilismo',
            legendaMax: '5 = Prática orientada 3x ou mais por semana',
          },
          {
            id: 'lc_6',
            enunciado:
              'Adoção de ergonomia adequada no posto de trabalho (altura da cadeira, apoio lombar, tela na altura dos olhos e pausas ativas a cada 60 min):',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'lc_7',
            enunciado:
              'Uso crônico ou abusivo de anti-inflamatórios e analgésicos opióides sob demanda sem prescrição médica atualizada?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'lc_8',
            enunciado:
              'Orientações posturais, prescrições analgésicas ativas e plano de reabilitação funcional:',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Evolução fisioterapêutica, manejo conservador da dor e metas de fortalecimento lombar...',
          },
        ],
      },

      // 4. Insuficiência Cardíaca (SBC / AHA-ACC)
      {
        condicao_principal: 'Insuficiência Cardíaca',
        titulo: 'Protocolo de Descompensação Cardíaca — Insuficiência Cardíaca',
        descricao:
          'Monitoramento hemodinâmico, sinais precoces de congestão volêmica (edema/ortopneia), classe funcional NYHA e peso seco.',
        questoes: [
          {
            id: 'ic_1',
            enunciado:
              'Ganho de peso rápido e inexplicável: houve aumento de peso superior a 2 kg em 2 a 3 dias consecutivos?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ic_2',
            enunciado:
              'Sintomas congestivos ao deitar: apresenta ortopneia (falta de ar deitado com necessidade de elevar a cabeceira com 2 ou mais travesseiros) ou dispneia paroxística noturna?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ic_3',
            enunciado:
              'Presença e evolução de inchaço (edema maleolar / pernas) com sinal do cacifo positivo nas últimas 48 horas:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Sem inchaço nas pernas',
              'Edema leve no final do dia que regride ao repouso',
              'Edema moderado persistente até a metade das pernas',
              'Edema volumoso que ascende para coxas, abdômen (ascite) ou anasarca',
            ],
          },
          {
            id: 'ic_4',
            enunciado:
              'Classe Funcional de dispneia aos esforços (Escala NYHA - New York Heart Association):',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Classe I: Sem limitação física em atividades cotidianas habituais',
              'Classe II: Leve limitação para esforços moderados (subir ladeira, carregar compras)',
              'Classe III: Marcada limitação para pequenos esforços cotidianos (tomar banho, vestir-se)',
              'Classe IV: Sintomas de falta de ar e cansaço mesmo em repouso absoluto',
            ],
          },
          {
            id: 'ic_5',
            enunciado:
              'Adesão diária aos medicamentos de insuficiência cardíaca (betabloqueador, IECA/BRA/sacubitril-valsartana, espironolactona e iSGLT2):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Interrupção frequente ou suspensão por conta própria',
            legendaMax: '5 = Uso rigoroso de todas as doses nos horários prescritos',
          },
          {
            id: 'ic_6',
            enunciado:
              'Cumprimento da restrição de líquidos diários (máximo 1,5L a 2L/dia) e dieta hipossódica rigorosa (< 3g sal/dia):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Sem restrição hídrica ou de sal',
            legendaMax: '5 = Restrição controlada e pesagem diária em jejum',
          },
          {
            id: 'ic_7',
            enunciado:
              'Apresentou episódios recentes de tontura ao levantar (hipotensão postural), síncope (desmaio) ou palpitações aceleradas?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ic_8',
            enunciado:
              'Peso atual em jejum e exames laboratoriais recentes (Creatinina, Potássio sérico, Peptídeo Natriurético BNP/NT-proBNP ou fração de ejeção do ecocardiograma):',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Ex: Peso: 78.4 kg; FE: 38%; BNP: 290 pg/mL; K+: 4.5 mEq/L (exames de 20/02/2026)',
          },
        ],
      },

      // 5. Asma Brônquica (GINA / ACT)
      {
        condicao_principal: 'Asma Brônquica',
        titulo: 'Protocolo de Controle de Asma — Asma Brônquica',
        descricao:
          'Estratificação do controle da asma segundo critérios GINA/ACT, uso de medicação de resgate vs. manutenção e técnica inalatória.',
        questoes: [
          {
            id: 'as_1',
            enunciado:
              'Frequência de sintomas diurnos de asma (chiado, aperto no peito, tosse ou falta de ar) nas últimas 4 semanas:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Nenhuma vez ou menos de 2 vezes por semana',
              '2 a 3 vezes por semana',
              '4 a 6 vezes por semana',
              'Diariamente / Várias vezes ao dia',
            ],
          },
          {
            id: 'as_2',
            enunciado:
              'Despertares noturnos por asma: acordou à noite ou de manhã cedo com tosse, falta de ar ou chiado no peito nas últimas 4 semanas?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'as_3',
            enunciado:
              'Frequência de uso do broncodilatador de alívio rápido / resgate (ex: Salbutamol, Fenoterol) nas últimas 4 semanas:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Nenhuma vez ou até 2 dias por semana',
              '3 a 4 dias por semana',
              'Mais de 4 dias por semana',
              'Diariamente ou mais de 2 vezes por dia',
            ],
          },
          {
            id: 'as_4',
            enunciado:
              'Apresentou qualquer limitação nas atividades rotineiras, laborais ou exercícios físicos causada pela asma no último mês?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'as_5',
            enunciado:
              'Adesão e técnica inalatória do corticoide inalatório de manutenção / medicação preventiva (com ou sem espaçador):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Não usa manutenção ou usa só na crise',
            legendaMax: '5 = Uso diário contínuo com técnica inalatória e enxágue oral perfeitos',
          },
          {
            id: 'as_6',
            enunciado:
              'Necessitou de atendimento em Pronto-Socorro ou uso de corticoide oral por exacerbação de asma nos últimos 6 meses?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'as_7',
            enunciado:
              'Identificação e controle de fatores desencadeantes ambientais no domicílio (poeira domiciliar, ácaros, animais de pelo, fumaça de tabaco, mofo ou produtos químicos fortes):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Alta exposição sem controle',
            legendaMax: '5 = Ambiente rigorosamente protegido e sem fumaça',
          },
          {
            id: 'as_8',
            enunciado:
              'Plano de ação escrito para crises de asma, valores de Peak Flow (se possuir) e orientações reforçadas pelo Concierge:',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Zona verde/amarela/vermelha pactuada, Peak Flow de 420 L/min, orientação sobre vacinação anual contra influenza...',
          },
        ],
      },

      // 6. Obesidade Grau II (ABESO / WOF)
      {
        condicao_principal: 'Obesidade Grau II',
        titulo: 'Protocolo Multidisciplinar de Manejo Ponderal — Obesidade Grau II',
        descricao:
          'Monitoramento antropométrico (IMC/circunferência), adesão nutricional, rastreamento de comorbidades metabólicas e saúde mental.',
        questoes: [
          {
            id: 'ob_1',
            enunciado:
              'Peso corporal atual (kg), altura (m) e evolução ponderal nos últimos 30 dias:',
            tipo: 'texto_livre',
            obrigatoria: true,
            placeholder:
              'Ex: Peso: 106.5 kg, Altura: 1.72m (IMC: 36.0 kg/m²); redução de 2.1 kg no mês',
          },
          {
            id: 'ob_2',
            enunciado:
              'Circunferência da cintura atual (medida no ponto médio entre a última costela e a crista ilíaca):',
            tipo: 'texto_livre',
            obrigatoria: true,
            placeholder: 'Ex: 108 cm (mulheres meta < 80cm; homens meta < 94cm)',
          },
          {
            id: 'ob_3',
            enunciado:
              'Nível de adesão ao plano nutricional individualizado e restrição de alimentos ultraprocessados/bebidas açucaradas:',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Sem adesão / Consumo desregrado',
            legendaMax: '5 = Adesão plena com porções e horários estruturados',
          },
          {
            id: 'ob_4',
            enunciado:
              'Frequência e volume semanal de exercícios físicos moderados a vigorosos (meta ABESO: > 200 min/semana):',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Sedentário absoluto (0 dias por semana)',
              '1 a 2 dias por semana (menos de 90 min no total)',
              '3 a 4 dias por semana (150 min ou mais por semana)',
              '5 ou mais dias por semana com combinação de treino aeróbico e força',
            ],
          },
          {
            id: 'ob_5',
            enunciado:
              'Sintomas sugestivos de Síndrome da Apneia Obstrutiva do Sono (ronco alto, pausas respiratórias testemunhadas ou sonolência diurna excessiva)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ob_6',
            enunciado:
              'Frequência de episódios de compulsão alimentar periódica (ingestão descontrolada de grande volume de alimento em curto período de tempo):',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Nenhum episódio no último mês',
              '1 a 3 episódios leves no mês',
              '1 a 2 episódios por semana',
              'Mais de 3 episódios por semana com angústia marcante',
            ],
          },
          {
            id: 'ob_7',
            enunciado:
              'Acompanhamento médico para terapia farmacológica adjuvante (ex: análogos GLP-1, sibutramina, bupropiona-naltrexona) e/ou critérios para cirurgia bariátrica:',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ob_8',
            enunciado:
              'Metas ponderais compartilhadas, barreiras comportamentais identificadas e condutas de suporte:',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Pactuação de redução de 5% do peso corporal em 3 meses, diário alimentar e encaminhamento psicológico...',
          },
        ],
      },

      // 7. Gestação de Alto Risco (MS / FEBRASGO)
      {
        condicao_principal: 'Gestação de Alto Risco',
        titulo: 'Protocolo de Pré-Natal e Vigilância Materno-Fetal — Gestação de Alto Risco',
        descricao:
          'Vigilância obstétrica intensiva, sinais precoces de pré-eclâmpsia, vitalidade fetal, hemorragias e planejamento do parto.',
        questoes: [
          {
            id: 'gar_1',
            enunciado: 'Idade Gestacional atual (semanas e dias) e Data Provável do Parto (DPP):',
            tipo: 'texto_livre',
            obrigatoria: true,
            placeholder:
              'Ex: 29 semanas e 4 dias (DPP: 18/06/2026 calculada por USG de 1º trimestre)',
          },
          {
            id: 'gar_2',
            enunciado:
              'Sinais de alerta obstétrico imediato: apresentou sangramento vaginal, perda contínua de líquido aquoso ou contrações dolorosas regulares?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'gar_3',
            enunciado:
              'Sintomas pré-monitórios de pré-eclâmpsia / pico hipertensivo (cefaleia persistente refratária, escotomas cintilantes, epigastralgia em barra ou inchaço súbito na face/mãos)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'gar_4',
            enunciado:
              'Avaliação da movimentação fetal: o bebê tem se movimentado ativamente todos os dias (mobilograma satisfatório com ao menos 6 movimentos em 1 hora pós-refeição)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'gar_5',
            enunciado:
              'Aferição mais recente de Pressão Arterial domiciliar ou em consulta nas últimas 48 horas:',
            tipo: 'texto_livre',
            obrigatoria: true,
            placeholder: 'Ex: 120x75 mmHg (limite de segurança < 140x90 mmHg)',
          },
          {
            id: 'gar_6',
            enunciado:
              'Regularidade nas consultas de pré-natal de alto risco e exames ultrassonográficos com Doppler obstétrico:',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Consultas e exames em atraso',
            legendaMax: '5 = Pré-natal 100% em dia com especialista de alto risco',
          },
          {
            id: 'gar_7',
            enunciado:
              'Adesão diária à suplementação e medicamentos profiláticos (sulfato ferroso, ácido fólico/metilfolato, AAS profilático em baixas doses e carbonato de cálcio se indicados):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Não faz uso das medicações profiláticas',
            legendaMax: '5 = Uso diário contínuo conforme protocolo obstétrico',
          },
          {
            id: 'gar_8',
            enunciado:
              'Sintomas urinários (ardência ao urinar, polaciúria súbita ou dor lombar sugestiva de pielonefrite)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'gar_9',
            enunciado:
              'Maternidade de referência de alto risco pactuada, canal de emergência 24h e condutas orientadas pelo Concierge:',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Maternidade de referência vinculada, orientações para procurar pronto-atendimento se PA >= 140x90 mmHg...',
          },
        ],
      },

      // 8. Transtorno de Ansiedade (APA / DSM-5 / GAD-7)
      {
        condicao_principal: 'Transtorno de Ansiedade',
        titulo: 'Protocolo de Saúde Mental e Ansiedade — Transtorno de Ansiedade',
        descricao:
          'Monitoramento de sintomas ansiosos pelo GAD-7, frequência de crises de pânico, arquitetura do sono, adesão psicotrópica e psicoterapia.',
        questoes: [
          {
            id: 'ta_1',
            enunciado:
              'Nas últimas 2 semanas, com que frequência sentiu-se nervoso, ansioso ou com o sentimento de estar no limite (Item 1 GAD-7)?',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Nenhum dia',
              'Vários dias (menos de metade dos dias)',
              'Mais da metade dos dias',
              'Quase todos os dias',
            ],
          },
          {
            id: 'ta_2',
            enunciado:
              'Nas últimas 2 semanas, com que frequência teve dificuldade para controlar ou interromper as preocupações (Item 2 GAD-7)?',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Nenhum dia',
              'Vários dias (menos de metade dos dias)',
              'Mais da metade dos dias',
              'Quase todos os dias',
            ],
          },
          {
            id: 'ta_3',
            enunciado:
              'Ocorrência de ataques de pânico (crise súbita de medo intenso, palpitação, falta de ar, sudorese e sensação de desmaio) no último mês:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Nenhuma crise no último mês',
              '1 episódio isolado e de rápida resolução',
              '2 a 3 episódios no mês',
              'Episódios semanais recorrentes com evitação de locais',
            ],
          },
          {
            id: 'ta_4',
            enunciado:
              'Qualidade subjetiva do sono e presença de insônia (dificuldade de conciliar o sono, despertar precoce ou sono não restaurador):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Insônia grave todas as noites',
            legendaMax: '5 = Sono contínuo restaurador de 7 a 8 horas',
          },
          {
            id: 'ta_5',
            enunciado:
              'Sintomas somáticos associados (tensão muscular excessiva, bruxismo, cefaleia tensional ou distúrbios gastrintestinais de origem emocional)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ta_6',
            enunciado:
              'Adesão ao tratamento psicofarmacológico prescrito (antidepressivos ISRS/IRSN, estabilizadores) sem interrupção abrupta ou modificação de dose:',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Suspendeu a medicação sozinho',
            legendaMax: '5 = Tomada rigorosa diária conforme prescrição psiquiátrica',
          },
          {
            id: 'ta_7',
            enunciado: 'Acompanhamento psicoterapêutico (psicologia clínica) regular em andamento:',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ta_8',
            enunciado:
              'Rastreamento de ideação suicida ou desesperança marcante no último mês (protocolo de segurança do paciente):',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'ta_9',
            enunciado:
              'Gatilhos psicossociais relatados pelo paciente, rede de apoio familiar e encaminhamentos acordados:',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Fontes agudas de sobrecarga no trabalho, técnicas de respiração diafragmática pactuadas, suporte familiar...',
          },
        ],
      },

      // 9. Dislipidemia (SBC / NCEP ATP III)
      {
        condicao_principal: 'Dislipidemia',
        titulo: 'Protocolo de Controle Lipídico e Risco Aterogênico — Dislipidemia',
        descricao:
          'Monitoramento de frações lipídicas (LDL-c, não-HDL, Triglicérides), estratificação de risco cardiovascular e segurança de estatinas.',
        questoes: [
          {
            id: 'dl_1',
            enunciado:
              'Perfil lipídico laboratorial mais recente (Colesterol Total, LDL-c, HDL-c, Não-HDL e Triglicérides):',
            tipo: 'texto_livre',
            obrigatoria: true,
            placeholder:
              'Ex: LDL: 122 mg/dL; HDL: 46 mg/dL; Não-HDL: 145 mg/dL; Triglicérides: 180 mg/dL (exame em 10/01/2026)',
          },
          {
            id: 'dl_2',
            enunciado:
              'Estratificação de risco cardiovascular global estimada pelo médico assistente:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Baixo Risco (meta LDL < 130 mg/dL)',
              'Intermediário (meta LDL < 100 mg/dL)',
              'Alto Risco (meta LDL < 70 mg/dL)',
              'Muito Alto Risco com evento prévio prévio IAM/AVC (meta LDL < 50 mg/dL)',
            ],
          },
          {
            id: 'dl_3',
            enunciado:
              'Adesão ao uso da medicação hipolipemiante prescrita (estatinas: atorvastatina, rosuvastatina, sinvastatina e/ou ezetimiba):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Não adere / Interrompeu por conta própria',
            legendaMax: '5 = Uso diário contínuo sem omissão de tomadas',
          },
          {
            id: 'dl_4',
            enunciado:
              'Sintomas musculares associados a estatinas (mialgia difusa, fraqueza muscular simétrica ou câimbras persistentes após início do remédio)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'dl_5',
            enunciado:
              'Adesão ao padrão dietético cardioprotetor (redução de gorduras saturadas, gorduras trans, carnes processadas e carboidratos refinados):',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Sem dieta cardioprotetora',
            legendaMax: '5 = Dieta rica em fibras solúveis, azeite e fitoesteróis',
          },
          {
            id: 'dl_6',
            enunciado:
              'Prática regular de exercícios aeróbicos estruturados visando elevação de HDL-c e metabolização de triglicérides (>= 150 min/semana)?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'dl_7',
            enunciado: 'Histórico de tabagismo ativo ou etilismo moderado a excessivo associado:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Não fuma e não consome álcool regularmente',
              'Ex-fumante há mais de 1 ano',
              'Fumante ativo ou usuário de dispositivos eletrônicos (vape)',
              'Consumo alcoólico frequente com impacto em triglicérides',
            ],
          },
          {
            id: 'dl_8',
            enunciado:
              'Condutas clínicas, metas individualizadas de LDL-c e prazo para dosagem de controle laboratorial (CK/CPK, TGO/TGP, Perfil lipídico):',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Meta pactuada de LDL < 70 mg/dL, reforço de dieta cardioprotetora e agendamento de novo exame em 90 dias...',
          },
        ],
      },

      // 10. DPOC (GOLD / mMRC)
      {
        condicao_principal: 'DPOC',
        titulo: 'Protocolo Respiratório para Doença Pulmonar Obstrutiva Crônica — DPOC',
        descricao:
          'Avaliação funcional pelo mMRC, frequência de exacerbações agudas, cessação do tabagismo, adesão a LAMA/LABA e profilaxia vacinal.',
        questoes: [
          {
            id: 'dpoc_1',
            enunciado:
              'Escala de Dispneia do Medical Research Council modificada (mMRC) para avaliação do grau de falta de ar:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Grau 0: Falta de ar apenas em exercício físico vigoroso',
              'Grau 1: Falta de ar ao caminhar rápido no plano ou subir uma ladeira leve',
              'Grau 2: Anda mais devagar do que pessoas da mesma idade no plano ou precisa parar para respirar ao caminhar no próprio passo',
              'Grau 3: Para para respirar após caminhar cerca de 100 metros ou alguns minutos no plano',
              'Grau 4: Falta de ar extrema ao sair de casa ou ao se vestir/despir',
            ],
          },
          {
            id: 'dpoc_2',
            enunciado:
              'Status atual em relação ao uso de tabaco / cigarros / dispositivos eletrônicos:',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Não fumante / Ex-fumante há mais de 1 ano',
              'Ex-fumante recente (cessação há menos de 1 ano)',
              'Fumante ativo com plano de cessação em andamento',
              'Fumante ativo diário sem intenção imediata de parar',
            ],
          },
          {
            id: 'dpoc_3',
            enunciado:
              'Histórico de exacerbações agudas nos últimos 12 meses (piora de falta de ar, aumento no volume ou purulência do escarro exigindo antibiótico ou corticoide sistêmico):',
            tipo: 'multipla_escolha',
            obrigatoria: true,
            opcoes: [
              'Nenhuma exacerbação nos últimos 12 meses',
              '1 exacerbação tratada em domicílio / ambulatório',
              '2 ou mais exacerbações ambulatoriais',
              '1 ou mais internações hospitalares por descompensação pulmonar',
            ],
          },
          {
            id: 'dpoc_4',
            enunciado:
              'Adesão diária à terapia inalatória de manutenção (LAMA, LABA e/ou corticoide inalatório) e domínio da técnica de inalação do dispositivo:',
            tipo: 'escala',
            obrigatoria: true,
            escalaMin: 0,
            escalaMax: 5,
            legendaMin: '0 = Não utiliza / Técnica inadequada',
            legendaMax: '5 = Uso diário correto com fluxo inspiratório e apneia adequados',
          },
          {
            id: 'dpoc_5',
            enunciado:
              'Vacinação preventiva em dia para Influenza anual, Pneumocócica (VPC13/VPP23) e COVID-19 conforme preconizado pelas diretrizes GOLD?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'dpoc_6',
            enunciado: 'Oximetria de pulso (SpO2 em ar ambiente em repouso) recente:',
            tipo: 'texto_livre',
            obrigatoria: true,
            placeholder: 'Ex: SpO2: 94% em ar ambiente (alerta se SpO2 <= 90% em repouso)',
          },
          {
            id: 'dpoc_7',
            enunciado:
              'Faz uso de oxigenoterapia domiciliar prolongada (ODP) com indicação por gasometria arterial?',
            tipo: 'sim_nao',
            obrigatoria: true,
          },
          {
            id: 'dpoc_8',
            enunciado:
              'Orientações sobre sinais precoces de exacerbação, reabilitação pulmonar e condutas registradas:',
            tipo: 'texto_livre',
            obrigatoria: false,
            placeholder:
              'Orientações para procurar suporte precoce ao observar mudança de cor do catarro, exercícios respiratórios...',
          },
        ],
      },
    ]

    for (const p of updatedProtocols) {
      let record
      try {
        const results = app.findRecordsByFilter(
          'questionarios_templates',
          `condicao_principal = '${p.condicao_principal}'`,
          '',
          1,
          0,
        )
        if (results && results.length > 0) {
          record = results[0]
        } else {
          record = new Record(templatesCol)
        }
      } catch (_) {
        record = new Record(templatesCol)
      }

      record.set('condicao_principal', p.condicao_principal)
      record.set('titulo', p.titulo)
      record.set('descricao', p.descricao)
      record.set('ativo', true)
      record.set('questoes', p.questoes)
      app.save(record)
    }
  },
  (app) => {
    // Em rollback, mantém a integridade da coleção
  },
)
