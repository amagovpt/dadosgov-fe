const bigNumbersSustainableDevelopmentQuery = `WITH num_reformas AS (
   SELECT 
    i.cd_dimensao_estruturante,
    COUNT(DISTINCT r.cd_reforma) AS num_reformas
   FROM prr.reformas r
    JOIN prr.investimentos i ON SPLIT_PART(r.cd_reforma, '-', 1) = i.cd_dimensao_estruturante
   WHERE i.dt_referencia = (SELECT max(dt_referencia) FROM prr.investimentos)
    AND r.dt_referencia = (SELECT max(dt_referencia) FROM prr.reformas)
   GROUP BY i.cd_dimensao_estruturante
  )
SELECT 
    i.cd_dimensao_estruturante AS id,
    COUNT(DISTINCT combined.cd_componente) AS "investmentComponents",
    COUNT(DISTINCT i.cd_investimento) AS "tangibleInvestments",
    num_reformas AS "structuralReforms"
FROM 
    prr.investimentos i
LEFT JOIN 
    (
        SELECT cd_dimensao_estruturante, cd_componente
        FROM prr.investimentos
        WHERE cd_dimensao_estruturante = cd_dimensao_estruturante
        AND dt_referencia = (SELECT MAX(dt_referencia) FROM prr.investimentos)
        UNION
        SELECT SPLIT_PART(cd_reforma, '-', 1) AS cd_dimensao_estruturante, cd_componente
        FROM prr.reformas
        WHERE dt_referencia = (SELECT MAX(dt_referencia) FROM prr.reformas)
    ) combined ON i.cd_dimensao_estruturante = combined.cd_dimensao_estruturante
JOIN 
    num_reformas ON num_reformas.cd_dimensao_estruturante = i.cd_dimensao_estruturante
WHERE 
    i.dt_referencia = (SELECT MAX(dt_referencia) FROM prr.investimentos)
 AND i.cd_dimensao_estruturante = 'TC'
GROUP BY 
    i.cd_dimensao_estruturante, num_reformas.num_reformas;`;

const transitionClimaticInNumbersQuery = `WITH investimento_total AS(
            SELECT SUM(montante_programado) AS investimento_total
            FROM prr.investimentos
            WHERE dt_referencia = (SELECT max(dt_referencia) FROM prr.investimentos)
        ),
            projetos_tmp AS (  
            SELECT i.cd_investimento,
              CASE WHEN SUM(p.valor_executado) IS NULL
                        THEN 0
                        ELSE SUM(p.valor_executado)
                        END AS valor_gasto
                FROM 
                 prr.investimentos i 
                 LEFT JOIN prr.projetos p ON p.cd_investimento = substring(i.cd_investimento, 4) AND p.dt_referencia = (( SELECT max(projetos.dt_referencia) AS max
                       FROM prr.projetos))
                   WHERE i.dt_referencia = (( SELECT max(investimentos.dt_referencia) AS max
                   FROM prr.investimentos))
                       GROUP BY i.cd_investimento
            )
        SELECT 
            i.cd_dimensao_estruturante AS id,
            i.ds_dimensao_estruturante AS name,
            investimento_total AS "totalInvestmentPrr",
            SUM(montante_programado) AS "allocatedFundsDimension",
            SUM(p.valor_gasto) AS "fundsSpentDimension"
        FROM prr.investimentos i JOIN projetos_tmp p ON i.cd_investimento = p.cd_investimento, investimento_total 
        WHERE cd_dimensao_estruturante = cd_dimensao_estruturante
            AND i.dt_referencia = (SELECT max(dt_referencia) FROM prr.investimentos)
   AND i.cd_dimensao_estruturante = 'TC'
        GROUP BY i.cd_dimensao_estruturante, i.ds_dimensao_estruturante, 
            investimento_total;`;

const investmentInDetailClimateTransitionQuery = `WITH max_datas AS (
    SELECT
        (SELECT MAX(dt_referencia) FROM prr.investimentos) AS max_inv,
        (SELECT MAX(dt_referencia) FROM prr.projetos) AS max_proj,
        (SELECT MAX(dt_referencia) FROM prr.milestones_targets) AS max_mt
),

/* =====================================================
   INVESTIMENTOS NA ÚLTIMA DATA
   ===================================================== */
inv_latest AS (
    SELECT i.*
    FROM prr.investimentos i
    JOIN max_datas md ON i.dt_referencia = md.max_inv
    WHERE i.cd_dimensao_estruturante = 'TC'
),

/* =====================================================
   VALOR GASTO POR INVESTIMENTO
   ===================================================== */
projetos_tmp AS (
    SELECT
        i.cd_investimento,
        COALESCE(SUM(p.valor_executado), 0::numeric) AS valor_gasto
    FROM inv_latest i
    JOIN max_datas md ON TRUE
    LEFT JOIN prr.projetos p
        ON p.cd_investimento = substring(i.cd_investimento, 4)
       AND p.dt_referencia = md.max_proj
    GROUP BY i.cd_investimento
),

/* =====================================================
   RESUMO POR COMPONENTE
   ===================================================== */
componentes_resumo AS (
    SELECT
        i.cd_dimensao_estruturante,
        i.ds_dimensao_estruturante,
        i.cd_componente AS id,
        COALESCE(d.web_name, i.ds_componente) AS nome,
        COUNT(i.cd_investimento) AS numero,
        CASE
            WHEN SUM(i.montante_programado) = 0 THEN 0
            ELSE SUM(p.valor_gasto) / SUM(i.montante_programado)
        END AS percentagem_conclusao
    FROM inv_latest i
    JOIN projetos_tmp p
        ON p.cd_investimento = i.cd_investimento
    LEFT JOIN prr.dr_resiliencia_dicionario d
        ON i.ds_componente = d.ds_componente
    GROUP BY
        i.cd_dimensao_estruturante,
        i.ds_dimensao_estruturante,
        i.cd_componente,
        COALESCE(d.web_name, i.ds_componente)
),

/* =====================================================
   PERCENTAGEM DE EXECUÇÃO POR INVESTIMENTO
   ===================================================== */
investimentos_execucao AS (
    SELECT
        i.cd_investimento,
        i.cd_componente,
        CASE
            WHEN SUM(i.montante_programado) = 0 THEN 0
            ELSE SUM(p.valor_gasto) / SUM(i.montante_programado)
        END AS percentagem_conclusao_execucao
    FROM inv_latest i
    JOIN projetos_tmp p
        ON p.cd_investimento = i.cd_investimento
    GROUP BY
        i.cd_investimento,
        i.cd_componente
),

/* =====================================================
   CÓDIGO DA MVIEW INCORPORADO
   ===================================================== */
mt_base AS (
    SELECT
        mt.dt_referencia,
        mt.numero_sequencial,
        substring(mt.reforma_investimento, 1, 10) AS reforma_investimento,
        mt.nome_reforma_investimento,
        mt.milestone_target,
        mt.nome_milestone_target,
        mt.indicador_qualitativo,
        mt.unidade_medida,
        mt.baseline,
        mt.objetivo,
        mt.dt_conclusao,
        mt.metodologia,
        mt.responsabilidade_reporte_implementacao,
        mt.descricao_definicao_milestone_target,
        mt.premissas_riscos,
        mt.mecanismo_verificicacao,
        mt.indicadores_desembolso,
        mt.natureza_medida,
        mt.dt_conclusao_efetiva,
        mt.valor_atingido
    FROM prr.milestones_targets mt
    JOIN max_datas md ON mt.dt_referencia = md.max_mt
    WHERE mt.reforma_investimento LIKE '%C04%'

    UNION

    SELECT
        mt.dt_referencia,
        mt.numero_sequencial,
        mt.reforma_investimento,
        mt.nome_reforma_investimento,
        mt.milestone_target,
        mt.nome_milestone_target,
        mt.indicador_qualitativo,
        mt.unidade_medida,
        mt.baseline,
        mt.objetivo,
        mt.dt_conclusao,
        mt.metodologia,
        mt.responsabilidade_reporte_implementacao,
        mt.descricao_definicao_milestone_target,
        mt.premissas_riscos,
        mt.mecanismo_verificicacao,
        mt.indicadores_desembolso,
        mt.natureza_medida,
        mt.dt_conclusao_efetiva,
        mt.valor_atingido
    FROM prr.milestones_targets mt
    JOIN max_datas md ON mt.dt_referencia = md.max_mt
    WHERE mt.reforma_investimento NOT LIKE '%C04%'
),

/* =====================================================
   MILESTONES TARGETS IDs
   ===================================================== */
milestones_targets_ids AS (
    SELECT
        'ID' || row_number() OVER (ORDER BY reforma_investimento) AS reforma_investimento_id,
        reforma_investimento
    FROM (
        SELECT DISTINCT reforma_investimento
        FROM mt_base
    ) t
),

mview_base AS (
    SELECT
        i.dt_referencia,
        i.cd_dimensao_estruturante,
        mti.reforma_investimento_id AS id_investimento,
        i.cd_investimento,
        i.ds_investimento AS nome_investimento,
        ''::text AS descricao_investimento,
        ''::text AS data_conclusao_investimento,
        CASE
            WHEN mt.dt_conclusao_efetiva IS NULL THEN false
            ELSE true
        END AS terminado,
        COALESCE(i.montante_programado, 0::numeric) AS valor_atribuido,
        COALESCE(p.valor_gasto, 0::numeric) AS valor_gasto,
        COALESCE(i.montante_subvencoes, 0::numeric) AS valor_fundo_perdido,
        COALESCE(i.montante_emprestimos, 0::numeric) AS valor_emprestimos,
        ''::text AS numero_intervencoes,
        mt.milestone_target AS milestone_ou_target,
        mt.nome_milestone_target AS nome_indicador_execucao,
        MAX(mt.descricao_definicao_milestone_target) AS ds_indicador_execucao,
        CASE
            WHEN mt.valor_atingido IS NOT NULL
             AND (shared.safe_text2numeric(mt.objetivo) - shared.safe_text2numeric(mt.baseline)) <> 0
            THEN ROUND(
                (mt.valor_atingido - shared.safe_text2numeric(mt.baseline))
                / (shared.safe_text2numeric(mt.objetivo) - shared.safe_text2numeric(mt.baseline)),
                1
            )
            ELSE 0::numeric
        END AS percentagem_conclusao,
        prr.to_quarters(MAX(prr.to_date(mt.dt_conclusao))) AS dt_conclusao_milestone_target,
        mt.dt_conclusao_efetiva::text AS dt_conclusao_milestone_target_efetiva,
        jsonb_agg(
            jsonb_build_object(
                'baseline', shared.safe_text2numeric(mt.baseline),
                'objective', shared.safe_text2numeric(mt.objetivo, 0::numeric),
                'quarter', split_part(mt.dt_conclusao, ' ', 1),
                'year', split_part(mt.dt_conclusao, ' ', 2)
            )
        ) AS dados_grafico,
        CASE
            WHEN mt.milestone_target = 'Target' THEN true
            ELSE false
        END AS tem_grafico
    FROM mt_base mt
    JOIN milestones_targets_ids mti
        ON mt.reforma_investimento = mti.reforma_investimento
    JOIN inv_latest i
        ON replace(i.cd_investimento, '-', '#') = replace(mt.reforma_investimento, '-', '#')
    JOIN projetos_tmp p
        ON mt.reforma_investimento = p.cd_investimento
    GROUP BY
        i.dt_referencia,
        i.cd_dimensao_estruturante,
        mti.reforma_investimento_id,
        i.cd_investimento,
        i.ds_investimento,
        CASE WHEN mt.dt_conclusao_efetiva IS NULL THEN false ELSE true END,
        COALESCE(i.montante_programado, 0::numeric),
        COALESCE(p.valor_gasto, 0::numeric),
        COALESCE(i.montante_subvencoes, 0::numeric),
        COALESCE(i.montante_emprestimos, 0::numeric),
        CASE
            WHEN mt.valor_atingido IS NOT NULL
             AND (shared.safe_text2numeric(mt.objetivo) - shared.safe_text2numeric(mt.baseline)) <> 0
            THEN ROUND(
                (mt.valor_atingido - shared.safe_text2numeric(mt.baseline))
                / (shared.safe_text2numeric(mt.objetivo) - shared.safe_text2numeric(mt.baseline)),
                1
            )
            ELSE 0::numeric
        END,
        mt.milestone_target,
        mt.nome_milestone_target,
        mt.dt_conclusao_efetiva
),

/* =====================================================
   TERMINADO TOTALMENTE
   ===================================================== */
terminado_totalmente AS (
    SELECT
        a.id_investimento,
        CASE WHEN b.id_investimento IS NULL THEN true ELSE false END AS terminado
    FROM (
        SELECT DISTINCT mb.id_investimento
        FROM mview_base mb
    ) a
    LEFT JOIN (
        SELECT DISTINCT mb.id_investimento
        FROM mview_base mb
        WHERE mb.terminado = false
    ) b
        ON a.id_investimento = b.id_investimento
),

/* =====================================================
   DETALHE FINAL DOS INVESTIMENTOS
   ===================================================== */
investimentos_detalhe AS (
    SELECT
        mb.id_investimento,
        mb.cd_investimento,
        mb.nome_investimento,
        mb.descricao_investimento,
        mb.data_conclusao_investimento,
        MAX(mb.valor_atribuido)::numeric AS valor_atribuido,
        MAX(mb.valor_gasto)::numeric AS valor_gasto,
        MAX(mb.valor_emprestimos)::numeric AS valor_emprestimos,
        MAX(mb.valor_fundo_perdido)::numeric AS valor_fundo_perdido,
        tt.terminado,
        CASE
            WHEN tt.terminado = false
                THEN prr.to_quarters(MAX(prr.to_date(mb.dt_conclusao_milestone_target)))
            ELSE prr.to_months(MAX(mb.dt_conclusao_milestone_target_efetiva::date))
        END AS data_conclusao,
        jsonb_agg(
            jsonb_build_object(
				'milestoneOrTarget', mb.milestone_ou_target,    			
				'executionIndicatorId', md5(mb.nome_indicador_execucao),
                'executionIndicatorName', COALESCE(mb.nome_indicador_execucao, ''),
                'dsExecutionIndicator', COALESCE(mb.ds_indicador_execucao, ''),
                'dtConclusionMilestoneTarget',
                    CASE
                        WHEN mb.dt_conclusao_milestone_target_efetiva IS NOT NULL
                            THEN prr.to_months(mb.dt_conclusao_milestone_target_efetiva::date)
                        ELSE mb.dt_conclusao_milestone_target
                    END,
                'graphicData', mb.dados_grafico,
                'hasGraph', mb.tem_grafico,
                'finished', mb.terminado,
                'numberOfInterventions', mb.numero_intervencoes,
                'completionPercentage', mb.percentagem_conclusao
            )
            ORDER BY prr.to_date(mb.dt_conclusao_milestone_target)
        ) AS milestones_targets
    FROM mview_base mb
    JOIN terminado_totalmente tt
        ON mb.id_investimento = tt.id_investimento
    GROUP BY
        mb.id_investimento,
        mb.cd_investimento,
        mb.nome_investimento,
        mb.descricao_investimento,
        mb.data_conclusao_investimento,
        tt.terminado
),

/* =====================================================
   JUNÇÃO FINAL INVESTIMENTO
   ===================================================== */
investimentos_final AS (
    SELECT
        i.cd_componente,
        idt.id_investimento,
        idt.cd_investimento,
        idt.nome_investimento,
        idt.descricao_investimento,
        idt.data_conclusao_investimento,
        ie.percentagem_conclusao_execucao AS percentagem_conclusao,
        idt.valor_atribuido,
        idt.valor_gasto,
        idt.valor_emprestimos,
        idt.valor_fundo_perdido,
        idt.terminado,
        idt.data_conclusao,
        idt.milestones_targets
    FROM investimentos_detalhe idt
    LEFT JOIN investimentos_execucao ie
        ON ie.cd_investimento = idt.cd_investimento
    LEFT JOIN inv_latest i
        ON i.cd_investimento = idt.cd_investimento
),

/* =====================================================
   SOURCE INFO
   ===================================================== */
global_dates AS (
    SELECT GREATEST(md.max_inv, md.max_proj, md.max_mt)::date AS reference_date
    FROM max_datas md
),

latest_resources AS (
    SELECT DISTINCT ON (r.table_name)
        r.table_name,
        r.latest,
        r.last_modified,
        r.published,
        r.title,
        r.format,
        d.organization_acronym,
        d.organization_page
    FROM metadata.resources r
    JOIN metadata.datasets d
        ON r.dataset_id = d.id
    WHERE r.table_name IN ('investimentos', 'projetos', 'milestones_targets')
      AND d.thematic_area = 'pt-prr'
    ORDER BY r.table_name, r.last_modified DESC
),

source_cte AS (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'source',           lr.organization_acronym,
                'sourceLink',       lr.organization_page,
                'url',              lr.latest,
                'referenceDate',    gd.reference_date,
                'modificationDate', lr.last_modified,
                'publicationDate',  lr.published,
                'title',            lr.title,
                'format',           lr.format
            )
            ORDER BY lr.table_name
        ),
        '[]'::jsonb
    ) AS source_info
    FROM latest_resources lr
    CROSS JOIN global_dates gd
)

/* =====================================================
   OUTPUT FINAL
   ===================================================== */
SELECT
    tabs_cte.tabs as "data",
    source_cte.source_info AS "sourceInfo"
FROM (
    SELECT
        jsonb_agg(
            jsonb_build_object(
                'id', cr.id,
                'name', cr.nome,
                'number', cr.numero,
                'completionPercentage', cr.percentagem_conclusao,
                'investments',
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'idInvestment', inf.id_investimento,
                                'cdInvestment', inf.cd_investimento,
                                'investmentName', inf.nome_investimento,
                                'investmentDescription', inf.descricao_investimento,
                                'investmentDateCompletion', inf.data_conclusao_investimento,
                                'completionPercentage', inf.percentagem_conclusao,
                                'assignedAmount', inf.valor_atribuido,
                                'amountSpent', inf.valor_gasto,
                                'loanValue', inf.valor_emprestimos,
                                'lostFundAmount', inf.valor_fundo_perdido,
                                'finished', inf.terminado,
                                'completionDate', inf.data_conclusao,
                                'milestonesTargets', inf.milestones_targets
                            )
                            ORDER BY inf.data_conclusao, inf.nome_investimento
                        )
                        FROM investimentos_final inf
                        WHERE inf.cd_componente = cr.id
                    )
            )
            ORDER BY cr.id
        ) AS tabs
    FROM componentes_resumo cr
) tabs_cte
CROSS JOIN source_cte;`;

const reformsInDetailsClimateTransitionQuery = `WITH max_datas AS (
    SELECT
        (SELECT MAX(dt_referencia) FROM prr.reformas) AS max_reformas,
        (SELECT MAX(dt_referencia) FROM prr.milestones_targets) AS max_mt,
        (SELECT MAX(dt_referencia) FROM prr.investimentos) AS max_inv
),

/* =====================================================
   1) APURAMENTO DA PERCENTAGEM POR REFORMA
   ===================================================== */
apuramento_percentagem AS (
    SELECT
        a.cd_reforma,
        a.concluidos::decimal / NULLIF(a.total::decimal, 0) AS percentagem_conclusao
    FROM (
        SELECT
            mt.reforma_investimento AS cd_reforma,
            COUNT(mt.reforma_investimento) AS total,
            SUM(CASE WHEN mt.dt_conclusao_efetiva IS NULL THEN 0 ELSE 1 END) AS concluidos
        FROM prr.milestones_targets mt
        JOIN max_datas md ON mt.dt_referencia = md.max_mt
        WHERE RIGHT(mt.reforma_investimento, 3) LIKE 'r%'
        GROUP BY mt.reforma_investimento
    ) a
),
/* =====================================================
   MILESTONES TARGETS IDs
   ===================================================== */
milestones_targets_ids AS (
    SELECT
        'ID' || row_number() OVER (ORDER BY reforma_investimento) AS reforma_investimento_id,
        reforma_investimento
    FROM (
        SELECT DISTINCT mt.reforma_investimento
        FROM prr.milestones_targets mt
        JOIN max_datas md
          ON mt.dt_referencia = md.max_mt
        WHERE RIGHT(mt.reforma_investimento, 3) LIKE 'r%'
    ) t
),
   
/* =====================================================
   2) REFORMAS COM MILESTONES/TARGETS
   ===================================================== */
reformas_com_milestones_targets AS (
    SELECT DISTINCT
        mt.reforma_investimento AS cd_reforma
    FROM prr.milestones_targets mt
    JOIN max_datas md ON mt.dt_referencia = md.max_mt
    WHERE RIGHT(mt.reforma_investimento, 3) LIKE 'r%'
),

/* =====================================================
   3) RESUMO POR COMPONENTE
   ===================================================== */
componentes_resumo AS (
    SELECT
        r.cd_componente AS id,
        COALESCE(d.web_name, r.ds_componente) AS nome,
        COUNT(DISTINCT r.cd_reforma) AS numero,
        ROUND(AVG(ap.percentagem_conclusao), 4) AS percentagem_conclusao
    FROM prr.reformas r
    JOIN max_datas md
      ON r.dt_referencia = md.max_reformas
    INNER JOIN reformas_com_milestones_targets rmt
      ON rmt.cd_reforma = r.cd_reforma
    INNER JOIN apuramento_percentagem ap
      ON ap.cd_reforma = r.cd_reforma
    LEFT JOIN prr.dr_resiliencia_dicionario d
      ON r.ds_componente = d.ds_componente
    WHERE rmt.cd_reforma LIKE 'TC%'
    GROUP BY
        r.cd_componente,
        COALESCE(d.web_name, r.ds_componente)
),

/* =====================================================
   4) INDICADORES / IDENTIFICADOR DA REFORMA (equiv. query 2)
   ===================================================== */
indicadores_execucao AS (
    SELECT
        mti.reforma_investimento_id AS id,
        mt.reforma_investimento AS cd_reforma,
        mt.nome_reforma_investimento AS nome_reforma,
        ap.percentagem_conclusao
    FROM prr.milestones_targets mt
    JOIN max_datas md
      ON mt.dt_referencia = md.max_mt
    INNER JOIN milestones_targets_ids mti
      ON mti.reforma_investimento = mt.reforma_investimento
    INNER JOIN apuramento_percentagem ap
      ON ap.cd_reforma = mt.reforma_investimento
    WHERE RIGHT(mt.reforma_investimento, 3) LIKE 'r%'
    GROUP BY
        mt.reforma_investimento,
        mt.nome_reforma_investimento,
        mti.reforma_investimento_id,
        ap.percentagem_conclusao
),

reformas_por_componente AS (
    SELECT
        r.cd_componente,
        r.ds_componente,
        r.cd_reforma,
        r.ds_reforma
    FROM prr.reformas r
    JOIN max_datas md
      ON r.dt_referencia = md.max_reformas
),

reformas_execucao AS (
    SELECT
        i.cd_dimensao_estruturante,
        i.ds_dimensao_estruturante,
        rc.cd_componente,
        COALESCE(d.web_name, rc.ds_componente) AS ds_componente,
        ie.id,
        rc.cd_reforma,
        rc.ds_reforma AS nome,
        ie.percentagem_conclusao
    FROM reformas_por_componente rc
    LEFT JOIN prr.investimentos i
      ON SPLIT_PART(rc.cd_reforma, '-', 1) = i.cd_dimensao_estruturante
    JOIN max_datas md
      ON i.dt_referencia = md.max_inv
    INNER JOIN indicadores_execucao ie
      ON ie.cd_reforma = rc.cd_reforma
    LEFT JOIN prr.dr_resiliencia_dicionario d
      ON rc.ds_componente = d.ds_componente
    WHERE i.cd_dimensao_estruturante = 'TC'
    GROUP BY
        i.cd_dimensao_estruturante,
        i.ds_dimensao_estruturante,
        rc.cd_componente,
        COALESCE(d.web_name, rc.ds_componente),
        ie.id,
        rc.cd_reforma,
        rc.ds_reforma,
        ie.percentagem_conclusao
),

/* =====================================================
   5) DETALHE DAS REFORMAS + MILESTONES/TARGETS (query 3)
   ===================================================== */
reformas_detalhe_base AS (
    SELECT
        mt.dt_referencia,
        LEFT(r.cd_reforma, 2) AS cd_dimensao_estruturante,
        mti.reforma_investimento_id AS id_reforma,
        r.cd_reforma,
        r.ds_reforma AS nome_reforma,
        ''::text AS descricao_reforma,
        ''::text AS data_conclusao_reforma,
        (mt.dt_conclusao_efetiva IS NOT NULL) AS terminado,
        0::numeric AS valor_atribuido,
        0::numeric AS valor_gasto,
        ''::text AS numero_intervencoes,
        mt.milestone_target AS milestone_ou_target,
        mt.nome_milestone_target AS nome_indicador_execucao,
        mt.descricao_definicao_milestone_target AS ds_indicador_execucao,
        CASE
            WHEN mt.valor_atingido IS NOT NULL THEN
                (mt.valor_atingido - shared.safe_text2numeric(COALESCE(NULLIF(REPLACE(mt.baseline, ' ', ''), ''), '0')))
                /
                NULLIF(
                    shared.safe_text2numeric(COALESCE(NULLIF(REPLACE(mt.objetivo, ' ', ''), ''), '0'))
                    -
                    shared.safe_text2numeric(COALESCE(NULLIF(REPLACE(mt.baseline, ' ', ''), ''), '0')),
                    0
                )
            ELSE 0::numeric
        END AS percentagem_conclusao,
        prr.to_quarters(MAX(prr.to_date(mt.dt_conclusao))) AS dt_conclusao_milestone_target,
        mt.dt_conclusao_efetiva::text AS dt_conclusao_milestone_target_efetiva,
        jsonb_agg(
            jsonb_build_object(
                'baseline', COALESCE(NULLIF(REPLACE(mt.baseline, ' ', ''), ''), '0'),
                'objective', COALESCE(NULLIF(REPLACE(mt.objetivo, ' ', ''), ''), '0'),
                'quarter', SPLIT_PART(mt.dt_conclusao, ' ', 1),
                'year', SPLIT_PART(mt.dt_conclusao, ' ', 2)
            )
        ) AS dados_grafico,
        (mt.milestone_target = 'Target') AS tem_grafico
    FROM prr.milestones_targets mt
    JOIN max_datas md
      ON mt.dt_referencia = md.max_mt
    JOIN milestones_targets_ids mti
      ON mt.reforma_investimento = mti.reforma_investimento
    JOIN prr.reformas r
      ON r.cd_reforma = mt.reforma_investimento
    WHERE LEFT(r.cd_reforma, 2) = 'TC'
    GROUP BY
        mt.dt_referencia,
        LEFT(r.cd_reforma, 2),
        mti.reforma_investimento_id,
        r.cd_reforma,
        r.ds_reforma,
        (mt.dt_conclusao_efetiva IS NOT NULL),
        mt.milestone_target,
        mt.nome_milestone_target,
        mt.descricao_definicao_milestone_target,
        mt.dt_conclusao_efetiva,
        mt.valor_atingido,
        shared.safe_text2numeric(COALESCE(NULLIF(REPLACE(mt.baseline, ' ', ''), ''), '0')),
        shared.safe_text2numeric(COALESCE(NULLIF(REPLACE(mt.objetivo, ' ', ''), ''), '0'))
),

reformas_detalhe AS (
    SELECT
        rb.id_reforma,
        rb.cd_reforma,
        rb.nome_reforma,
        rb.descricao_reforma,
        rb.data_conclusao_reforma,
        MAX(rb.valor_atribuido)::numeric AS valor_atribuido,
        MAX(rb.valor_gasto)::numeric AS valor_gasto,
        BOOL_AND(rb.terminado) AS terminado,
        CASE
            WHEN BOOL_AND(rb.terminado)
                THEN prr.to_months(MAX(rb.dt_conclusao_milestone_target_efetiva::date))
            ELSE prr.to_quarters(MAX(prr.to_date(rb.dt_conclusao_milestone_target)))
        END AS data_conclusao,
        jsonb_agg(
            jsonb_build_object(
                'milestoneOrTarget', rb.milestone_ou_target,
                'executionIndicatorId', md5(rb.nome_indicador_execucao),
                'executionIndicatorName', COALESCE(rb.nome_indicador_execucao, ''),
                'dsExecutionIndicator', COALESCE(rb.ds_indicador_execucao, ''),
                'dtConclusionMilestoneTarget',
                    CASE
                        WHEN rb.dt_conclusao_milestone_target_efetiva IS NOT NULL
                            THEN prr.to_months(rb.dt_conclusao_milestone_target_efetiva::date)
                        ELSE rb.dt_conclusao_milestone_target
                    END,
                'graphicData', rb.dados_grafico,
                'hasGraph', rb.tem_grafico,
                'finished', rb.terminado,
                'numberOfInterventions', rb.numero_intervencoes,
                'completionPercentage',
                    CASE
                        WHEN rb.milestone_ou_target = 'Milestone' THEN to_jsonb(0::integer)
                        ELSE to_jsonb(rb.percentagem_conclusao)
                    END
            )
            ORDER BY prr.to_date(rb.dt_conclusao_milestone_target)
        ) AS milestones_targets
    FROM reformas_detalhe_base rb
    GROUP BY
        rb.id_reforma,
        rb.cd_reforma,
        rb.nome_reforma,
        rb.descricao_reforma,
        rb.data_conclusao_reforma
),

/* =====================================================
   6) JUNÇÃO FINAL POR REFORMA
   ===================================================== */
reformas_final AS (
    SELECT
        re.cd_componente,
        rd.id_reforma,
        rd.cd_reforma,
        rd.nome_reforma,
        rd.descricao_reforma,
        rd.data_conclusao_reforma,
        re.percentagem_conclusao,
        rd.valor_atribuido,
        rd.valor_gasto,
        rd.terminado,
        rd.data_conclusao,
        rd.milestones_targets
    FROM reformas_detalhe rd
    LEFT JOIN reformas_execucao re
      ON re.cd_reforma = rd.cd_reforma
),

/* =====================================================
   7) SOURCE INFO
   ===================================================== */
global_dates AS (
    SELECT GREATEST(
        (SELECT MAX(dt_referencia)::date FROM prr.reformas),
        (SELECT MAX(dt_referencia)::date FROM prr.milestones_targets),
        (SELECT MAX(dt_referencia)::date FROM prr.investimentos)
    ) AS reference_date
),

latest_resources AS (
    SELECT DISTINCT ON (r.table_name)
        r.table_name,
        r.latest,
        r.last_modified,
        r.published,
        r.title,
        r.format,
        d.organization_acronym,
        d.organization_page
    FROM metadata.resources r
    JOIN metadata.datasets d
      ON r.dataset_id = d.id
    WHERE r.table_name IN ('reformas', 'milestones_targets', 'investimentos')
      AND d.thematic_area = 'pt-prr'
    ORDER BY r.table_name, r.last_modified DESC
),

source_cte AS (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'source',           lr.organization_acronym,
                'sourceLink',       lr.organization_page,
                'url',              lr.latest,
                'referenceDate',    gd.reference_date,
                'modificationDate', lr.last_modified,
                'publicationDate',  lr.published,
                'title',            lr.title,
                'format',           lr.format
            )
            ORDER BY lr.table_name
        ),
        '[]'::jsonb
    ) AS source_info
    FROM latest_resources lr
    CROSS JOIN global_dates gd
),

/* =====================================================
   8) TABS JSON
   ===================================================== */
tabs_cte AS (
    SELECT
        jsonb_agg(
            jsonb_build_object(
                'id', cr.id,
                'name', cr.nome,
                'number', cr.numero,
                'completionPercentage', cr.percentagem_conclusao,
                'reforms',
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'reformId', rf.id_reforma,
                                'cdReform', rf.cd_reforma,
                                'nameReform', rf.nome_reforma,
                                'dsReform', rf.descricao_reforma,
                                'renovationCompletionDate', rf.data_conclusao_reforma,
                                'completionPercentage', rf.percentagem_conclusao,
                                'assignedAmount', rf.valor_atribuido,
                                'amountSpent', rf.valor_gasto,
                                'finished', rf.terminado,
                                'completionDate', rf.data_conclusao,
                                'milestonesTargets', rf.milestones_targets
                            )
                            ORDER BY rf.data_conclusao, rf.nome_reforma
                        )
                        FROM reformas_final rf
                        WHERE rf.cd_componente = cr.id
                    )
            )
            ORDER BY cr.nome
        ) AS tabs
    FROM componentes_resumo cr
)

SELECT
    tabs_cte.tabs as "data",
    source_cte.source_info AS "sourceInfo"
FROM tabs_cte
CROSS JOIN source_cte;`;

export {
  bigNumbersSustainableDevelopmentQuery,
  transitionClimaticInNumbersQuery,
  investmentInDetailClimateTransitionQuery,
  reformsInDetailsClimateTransitionQuery,
};
