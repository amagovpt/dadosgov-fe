// Beneficiaries
const queryBeneficiaryOfPortugal2030 = `WITH valores_min_max AS (
    SELECT min(entidades_pt2030.fundo_aprovado) AS valor_finan_min,
      max(entidades_pt2030.fundo_aprovado) AS valor_finan_max,
      min(entidades_pt2030.fundo_executado) AS valor_exec_min,
      max(entidades_pt2030.fundo_executado) AS valor_exec_max,
      (SELECT min(operacoes_pt2030.fundo_pago) FROM pt2030.operacoes_pt2030) AS valor_pago_min,
      (SELECT max(operacoes_pt2030.fundo_pago) FROM pt2030.operacoes_pt2030) AS valor_pago_max
      FROM pt2030.entidades_pt2030
  ), num_proj_ent AS (
    SELECT e_1.nif_entidade,
      count(DISTINCT e_1.cd_operacao) AS num_proj
      FROM pt2030.entidades_pt2030 e_1
    GROUP BY e_1.nif_entidade
  ), num_projetos_min_max AS (
    SELECT min(num_proj_ent.num_proj) AS num_proj_min,
      max(num_proj_ent.num_proj) AS num_proj_max
      FROM num_proj_ent
  ),
  -- =========================================================
  -- Linhas de entidade já filtradas (grão entidade×operação),
  -- SEM os JOINs que causavam fan-out. Filtros de operação/região
  -- passam a EXISTS (semi-join) para não multiplicar linhas.
  -- =========================================================
  ent_ops AS (
    SELECT e.nif_entidade, e.ds_entidade, e.papel_entidade, e.cd_operacao,
           e.fundo_aprovado, e.fundo_executado
    FROM pt2030.entidades_pt2030 e
    -- 1) Filter by entity name
    -- 2) Filter by NIF
    WHERE ($1::text IS NULL OR LOWER(e.ds_entidade) LIKE LOWER('%' || $1::text || '%'))
      AND ($2::text IS NULL OR LOWER(e.nif_entidade) LIKE LOWER('%' || $2::text || '%'))
      -- 10) Filter by role
      AND ($10::text[] IS NULL OR LOWER(e.papel_entidade) = ANY(ARRAY(SELECT LOWER(x) FROM unnest($10::text[]) AS x)))
      -- 3-7) Filtros ao nível da operação (fundo, objetivos, programa, área temática)
      AND (
        ($3::text IS NULL AND $4::text IS NULL AND $5::text IS NULL AND $6::text IS NULL AND $7::text IS NULL)
        OR EXISTS (
          SELECT 1 FROM pt2030.operacoes_pt2030 o
          WHERE o.cd_operacao = e.cd_operacao
            AND ($3::text IS NULL OR o.ds_fundo = $3::text)
            AND ($4::text IS NULL OR o.ds_objetivo_estrategico = $4::text)
            AND ($5::text IS NULL OR LOWER(o.sg_objetivo_especifico) = LOWER($5::text))
            AND ($6::text IS NULL OR o.ds_programa = $6::text)
            AND ($7::text IS NULL OR o.ds_area_tematica = $7::text)
        )
      )
      -- 8-9) Filtros por região / concelho
      AND (
        ($8::text IS NULL AND $9::text IS NULL)
        OR EXISTS (
          SELECT 1 FROM pt2030.operacoes_regionalizadas_pt2030 opr
          WHERE opr.cd_operacao = e.cd_operacao
            AND ($8::text IS NULL OR opr.ds_nutsii_operacao = $8::text)
            AND ($9::text IS NULL OR opr.ds_concelho_operacao = $9::text)
        )
      )
  ),
  ent_agg AS (
    SELECT nif_entidade, ds_entidade, papel_entidade,
           SUM(fundo_aprovado)  AS total_fundo_aprovado,
           SUM(fundo_executado) AS total_fundo_executado,
           COUNT(DISTINCT cd_operacao)::numeric AS num_projetos
    FROM ent_ops
    GROUP BY nif_entidade, ds_entidade, papel_entidade
  ),
  pag_agg AS (
    SELECT x.nif_entidade, x.papel_entidade,
           SUM(o.fundo_pago) AS total_fundo_pago
    FROM (SELECT DISTINCT nif_entidade, papel_entidade, cd_operacao FROM ent_ops) x
    JOIN pt2030.operacoes_pt2030 o ON o.cd_operacao = x.cd_operacao
    GROUP BY x.nif_entidade, x.papel_entidade
  )
SELECT jsonb_build_object(
  'data', COALESCE(jsonb_agg(data_row), '[]'::jsonb),
  'filters', jsonb_build_object(
    'approvedValueMin', (SELECT valor_finan_min FROM valores_min_max),
    'approvedValueMax', (SELECT valor_finan_max FROM valores_min_max),
    'executedValueMin', (SELECT valor_exec_min FROM valores_min_max),
    'executedValueMax', (SELECT valor_exec_max FROM valores_min_max),
    'paidValueMin', (SELECT valor_pago_min FROM valores_min_max),
    'paidValueMax', (SELECT valor_pago_max FROM valores_min_max),
    'projectsAmountMin', (SELECT num_proj_min FROM num_projetos_min_max),
    'projectsAmountMax', (SELECT num_proj_max FROM num_projetos_min_max)
  )
) AS result
FROM (
  SELECT jsonb_build_object(
    'entityName', agg.ds_entidade,
    'entityNif', agg.nif_entidade,
    'entityRole', agg.papel_entidade,
    'approvedValue', agg.total_fundo_aprovado,
    'executedValue', agg.total_fundo_executado,
    'paidValue', agg.total_fundo_pago,
    'projectsAmount', agg.num_projetos
  ) AS data_row
   FROM (
     SELECT
       ea.nif_entidade,
       ea.ds_entidade,
       ea.papel_entidade,
       ea.total_fundo_aprovado,
       ea.total_fundo_executado,
       COALESCE(pa.total_fundo_pago, 0) AS total_fundo_pago,
       ea.num_projetos
     FROM ent_agg ea
     LEFT JOIN pag_agg pa
       ON pa.nif_entidade = ea.nif_entidade
      AND pa.papel_entidade = ea.papel_entidade
     -- HAVING original convertido em WHERE sobre os agregados já corretos
     WHERE ($11::integer IS NULL OR ea.num_projetos >= $11::integer)
       AND ($12::integer IS NULL OR ea.num_projetos <= $12::integer)
       AND ($13::numeric IS NULL OR ea.total_fundo_aprovado >= $13::numeric)
       AND ($14::numeric IS NULL OR ea.total_fundo_aprovado <= $14::numeric)
       AND ($15::numeric IS NULL OR ea.total_fundo_executado >= $15::numeric)
       AND ($16::numeric IS NULL OR ea.total_fundo_executado <= $16::numeric)
       AND ($17::numeric IS NULL OR COALESCE(pa.total_fundo_pago, 0) >= $17::numeric)
       AND ($18::numeric IS NULL OR COALESCE(pa.total_fundo_pago, 0) <= $18::numeric)
   ) agg
   ORDER BY
     CASE WHEN $20 = 'asc' THEN
       CASE
         WHEN $19 = 'approvedValue' THEN agg.total_fundo_aprovado
         WHEN $19 = 'executedValue' THEN agg.total_fundo_executado
         WHEN $19 = 'paidValue' THEN agg.total_fundo_pago
         WHEN $19 = 'projectsAmount' THEN agg.num_projetos
       END
     END ASC,
     CASE WHEN $20 = 'desc' THEN
       CASE
         WHEN $19 = 'approvedValue' THEN agg.total_fundo_aprovado
         WHEN $19 = 'executedValue' THEN agg.total_fundo_executado
         WHEN $19 = 'paidValue' THEN agg.total_fundo_pago
         WHEN $19 = 'projectsAmount' THEN agg.num_projetos
       END
     END DESC
   LIMIT $21
   OFFSET $22
) AS subquery;
`;

const queryBeneficiaryOfPortugal2030Count = `
SELECT COUNT(*) AS total
FROM (
  SELECT 
    e.nif_entidade,
    e.ds_entidade,
    e.papel_entidade
  FROM pt2030.entidades_pt2030 e
    LEFT JOIN pt2030.operacoes_pt2030 o ON e.cd_operacao = o.cd_operacao
    LEFT JOIN pt2030.operacoes_regionalizadas_pt2030 opr ON e.cd_operacao = opr.cd_operacao
  WHERE ($1::text IS NULL OR LOWER(e.ds_entidade) LIKE LOWER('%' || $1::text || '%'))
    AND ($2::text IS NULL OR LOWER(e.nif_entidade) LIKE LOWER('%' || $2::text || '%'))
    AND ($3::text IS NULL OR o.ds_fundo = $3::text)
    AND ($4::text IS NULL OR o.ds_objetivo_estrategico = $4::text)
    AND ($5::text IS NULL OR LOWER(o.sg_objetivo_especifico) = LOWER($5::text))
    AND ($6::text IS NULL OR o.ds_programa = $6::text)
    AND ($7::text IS NULL OR o.ds_area_tematica = $7::text)
    AND ($8::text IS NULL OR opr.ds_nutsii_operacao = $8::text)
    AND ($9::text IS NULL OR opr.ds_concelho_operacao = $9::text)
    AND ($10::text[] IS NULL OR LOWER(e.papel_entidade) = ANY(ARRAY(SELECT LOWER(x) FROM unnest($10::text[]) AS x)))
  GROUP BY e.nif_entidade, e.ds_entidade, e.papel_entidade
  HAVING ($11::integer IS NULL OR COUNT(DISTINCT e.cd_operacao)::numeric >= $11::integer)
    AND ($12::integer IS NULL OR COUNT(DISTINCT e.cd_operacao)::numeric <= $12::integer)
    AND ($13::numeric IS NULL OR SUM(e.fundo_aprovado) >= $13::numeric)
    AND ($14::numeric IS NULL OR SUM(e.fundo_aprovado) <= $14::numeric)
    AND ($15::numeric IS NULL OR SUM(e.fundo_executado) >= $15::numeric)
    AND ($16::numeric IS NULL OR SUM(e.fundo_executado) <= $16::numeric)
    AND ($17::numeric IS NULL OR COALESCE(SUM(o.fundo_pago), 0) >= $17::numeric)
    AND ($18::numeric IS NULL OR COALESCE(SUM(o.fundo_pago), 0) <= $18::numeric)
) AS aggregated;
`;

const queryBeneficiaryOfPortugal2030TotalCount = `
SELECT COUNT(*) AS total
FROM (
  SELECT DISTINCT e.nif_entidade, e.papel_entidade
  FROM pt2030.entidades_pt2030 e
) AS unique_entities;
`;

const queryBeneficiaryOfPortugal2030SourceInfo = `WITH ref AS (
    SELECT GREATEST(
               (SELECT MAX(x.dt_referencia) FROM pt2030.entidades_pt2030 x),
               (SELECT MAX(x.dt_referencia) FROM pt2030.operacoes_pt2030 x),
      (SELECT MAX(x.dt_referencia) FROM pt2030.operacoes_regionalizadas_pt2030 x)
        ) AS reference_date
),
-- último recurso por tabela (um por cada table_name)
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
    JOIN metadata.datasets d ON r.dataset_id = d.id
    WHERE r.table_name IN ('entidades_pt2030', 'operacoes_pt2030', 'operacoes_regionalizadas_pt2030')
      AND d.thematic_area = 'pt-pt2030'
    ORDER BY r.table_name, r.last_modified DESC
),
-- sourceInfo no mesmo estilo do teu exemplo
source_cte AS (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'source',        lr.organization_acronym,
                'sourceLink',    lr.organization_page,
                'url',           lr.latest,
                'referenceDate', rd.reference_date,
                'modificationDate',  lr.last_modified,
                'publicationDate',     lr.published,
                'title',         lr.title,
                'format',        lr.format
            )
            ORDER BY lr.title
        ),
        '[]'::jsonb
    ) AS source_info
    FROM latest_resources lr
    CROSS JOIN ref rd
)
SELECT source_cte.source_info AS result
FROM source_cte;
`;

const queryBeneficiariesAndProjectsFiltersOfPortugal2030 = `SELECT
    ARRAY_AGG(DISTINCT ds_fundo)                    AS funds,
    ARRAY_AGG(DISTINCT ds_objetivo_estrategico)     AS policyObjectives,
    ARRAY_AGG(DISTINCT ds_programa_operacional)     AS programmes,
    (
        SELECT ARRAY_AGG(DISTINCT ds_area_tematica)
        FROM pt2030.operacoes_pt2030
    ) AS thematicAreas,
    (
        SELECT ARRAY_AGG(DISTINCT sg_objetivo_especifico)
        FROM pt2030.operacoes_pt2030
        WHERE sg_objetivo_especifico IS NOT NULL
    ) AS specificObjectives,
    (
        SELECT ARRAY_AGG(DISTINCT ds_nutsii_operacao)
        FROM pt2030.operacoes_regionalizadas_pt2030 opr
  WHERE opr.ds_nutsii_operacao <> 'Extra-Regio NUTS II'
    ) AS regions,
    (
        SELECT ARRAY_AGG(DISTINCT ds_concelho_operacao)
        FROM pt2030.operacoes_regionalizadas_pt2030 opr
  WHERE opr.ds_concelho_operacao <> '-'
    ) AS municipalities
FROM pt2030.dotacoes_objetivos_fundos_programas;
`;

const querySpecificObjectivesByPolicyObjectiveOfPortugal2030 = `WITH distinct_objectives AS (
    SELECT DISTINCT 
        o.cd_objetivo_especifico,
        o.sg_objetivo_especifico
    FROM pt2030.operacoes_pt2030 o
    WHERE ($1::text IS NULL OR o.ds_objetivo_estrategico = $1::text)
    ORDER BY o.cd_objetivo_especifico
)
SELECT COALESCE(
    jsonb_agg(
        jsonb_build_object(
            'code', sp.cd_objetivo_especifico,
            'shortName', sp.sg_objetivo_especifico
        )
        ORDER BY sp.cd_objetivo_especifico
    ),
    '[]'::jsonb
) AS specificobjectives
FROM distinct_objectives sp;
`;

const queryBeneficiarySheetOfPortugal2030 = `WITH subquery_fornecedores AS (
    SELECT 
        COALESCE(fornecedores_benprinc.nif_entidade, fornecedores_outrosben.nif_entidade) AS nif_entidade,
        COALESCE(fornecedores_benprinc.ds_entidade, fornecedores_outrosben.ds_entidade) AS ds_entidade,
        jsonb_build_object(
            'Fornecedores do Beneficiário Principal',
            jsonb_insert(
                fornecedores_benprinc.fornecedores_principal,
                '{0}'::text[],
                jsonb_build_object(
                    'Valor de Financiamento',
                    COALESCE((
                        SELECT sum((item.value ->> 'fundo_aprovado')::numeric)
                        FROM jsonb_array_elements(fornecedores_benprinc.fornecedores_principal) item(value)
                    ), 0::numeric)
                )
            ),
            'Fornecedor do Outros Beneficiários',
            jsonb_insert(
                fornecedores_outrosben.fornecedores_outros,
                '{0}'::text[],
                jsonb_build_object(
                    'Valor de Financiamento',
                    COALESCE((
                        SELECT sum((item.value ->> 'fundo_aprovado')::numeric)
                        FROM jsonb_array_elements(fornecedores_outrosben.fornecedores_outros) item(value)
                    ), 0::numeric)
                )
            )
        ) AS fornecedores_em_detalhe
    FROM (
        SELECT 
            aggregateddata.nif_entidade,
            aggregateddata.ds_entidade,
            jsonb_agg(
                jsonb_build_object(
                    'entityName', aggregateddata.ds_fornecedor,
                    'approvedValue', aggregateddata.total_valor
                )
            ) AS fornecedores_principal
        FROM (
            SELECT 
                ent_benprincipal.nif_entidade,
                ent_benprincipal.ds_entidade,
                ent_fornec.ds_entidade AS ds_fornecedor,
                sum(ent_fornec.fundo_aprovado) AS total_valor
            FROM pt2030.entidades_pt2030 ent_fornec
            JOIN pt2030.entidades_pt2030 ent_benprincipal 
                ON ent_fornec.cd_operacao = ent_benprincipal.cd_operacao
            WHERE ent_fornec.papel_entidade = 'Fornecedor'
              AND ent_benprincipal.papel_entidade = 'Beneficiário Principal'
            GROUP BY 
                ent_benprincipal.nif_entidade,
                ent_benprincipal.ds_entidade,
                ent_fornec.ds_entidade
        ) aggregateddata
        GROUP BY aggregateddata.nif_entidade, aggregateddata.ds_entidade
    ) fornecedores_benprinc
    FULL JOIN (
        SELECT 
            aggregateddata.nif_entidade,
            aggregateddata.ds_entidade,
            jsonb_agg(
                jsonb_build_object(
                    'entityName', aggregateddata.ds_fornecedor,
                    'approvedValue', aggregateddata.total_valor
                )
            ) AS fornecedores_outros
        FROM (
            SELECT 
                ent_benprincipal.nif_entidade,
                ent_benprincipal.ds_entidade,
                ent_fornec.ds_entidade AS ds_fornecedor,
                sum(ent_fornec.fundo_aprovado) AS total_valor
            FROM pt2030.entidades_pt2030 ent_fornec
            JOIN pt2030.entidades_pt2030 ent_benprincipal 
                ON ent_fornec.cd_operacao = ent_benprincipal.cd_operacao
            WHERE ent_fornec.papel_entidade = 'Fornecedor'
              AND ent_benprincipal.papel_entidade = 'Outros Beneficiários'
            GROUP BY 
                ent_benprincipal.nif_entidade,
                ent_benprincipal.ds_entidade,
                ent_fornec.ds_entidade
        ) aggregateddata
        GROUP BY aggregateddata.nif_entidade, aggregateddata.ds_entidade
    ) fornecedores_outrosben 
        ON fornecedores_benprinc.nif_entidade = fornecedores_outrosben.nif_entidade
),

subquery_nif AS (
    SELECT 
        e_1.nif_entidade,
        e_1.ds_entidade,
        sum(e_1.fundo_aprovado) AS valor_financiamento,
        sum(e_1.fundo_pago) AS valor_pago,
        count(DISTINCT e_1.cd_operacao) AS num_projetos
    FROM pt2030.entidades_pt2030 e_1
    WHERE e_1.dt_referencia = (
        SELECT max(entidades_pt2030.dt_referencia)
        FROM pt2030.entidades_pt2030
    )
    GROUP BY e_1.nif_entidade, e_1.ds_entidade
),

subquery_nif_papel AS (
    SELECT 
        e_1.nif_entidade,
        e_1.papel_entidade,
        sum(e_1.fundo_aprovado) AS valor_financiamento,
        sum(e_1.fundo_executado) AS valor_executado,
        sum(e_1.fundo_pago) AS valor_pago,
        count(DISTINCT e_1.cd_operacao) AS num_projetos
    FROM pt2030.entidades_pt2030 e_1
    WHERE e_1.dt_referencia = (
        SELECT max(entidades_pt2030.dt_referencia)
        FROM pt2030.entidades_pt2030
    )
    GROUP BY e_1.nif_entidade, e_1.papel_entidade
),

info_datasets AS (
    SELECT COALESCE(
        jsonb_agg(
            DISTINCT jsonb_build_object(
                'source', d.organization_acronym,
                'sourceLink', d.organization_page,
                'referenceDate', (
                    SELECT max(GREATEST(e.dt_referencia, o.dt_referencia))
                    FROM pt2030.entidades_pt2030 e
                    LEFT JOIN pt2030.operacoes_pt2030 o 
                        ON e.cd_operacao = o.cd_operacao
                ),
                'title', r.title,
                'format', r.format,
                'url', r.latest,
                'publicationDate', r.published,
                'modificationDate', r.last_modified,
                'updateDate', NULL::text
            )
        ),
        '[]'::jsonb
    ) AS "sourceInfo"
    FROM metadata.pt2030_delta_datasets d
    JOIN metadata.pt2030_delta_resources r
        ON d.id = r.dataset_id
    WHERE r.table_name = ANY (
        ARRAY['operacoes_pt2030', 'entidades_pt2030']
    )
)

SELECT 
    jsonb_build_object(
        'entityNif', e.nif_entidade,
        'entityName', e.ds_entidade,
        'approvedValue', subquery_nif.valor_financiamento,
        'paidValue', subquery_nif.valor_pago,
        'valuesByEntityRole', jsonb_agg(DISTINCT jsonb_build_object(
            'entityRole', subquery_nif_papel.papel_entidade,
            'approvedValue', subquery_nif_papel.valor_financiamento,
            'executedValue', subquery_nif_papel.valor_executado,
            'paidValue', subquery_nif_papel.valor_pago,
            'percentageExecutedValue',
            round(
                subquery_nif_papel.valor_executado /
                NULLIF(subquery_nif_papel.valor_financiamento, 0::numeric),
            2)
        )),
        'suppliersInDetail', CASE
            WHEN subquery_fornecedores.fornecedores_em_detalhe IS NULL 
            THEN NULL::jsonb
            ELSE subquery_fornecedores.fornecedores_em_detalhe
        END,
        'beneficiarySheet', jsonb_agg(DISTINCT jsonb_build_object(
            'entityName', e.ds_entidade,
            'approvedValue', subquery_nif.valor_financiamento,
            'paidValue', subquery_nif.valor_pago,
            'projectsAmount', subquery_nif.num_projetos,
            'entityNif', e.nif_entidade
        )),
        'numberOfProjectsByEntityRole', jsonb_agg(DISTINCT jsonb_build_object(
          'entityRole', subquery_nif_papel.papel_entidade,
          'projectsAmount', subquery_nif_papel.num_projetos
        ))
    ) AS data,

    id."sourceInfo"

FROM subquery_nif
LEFT JOIN pt2030.entidades_pt2030 e 
    ON subquery_nif.nif_entidade = e.nif_entidade
LEFT JOIN subquery_nif_papel 
    ON subquery_nif_papel.nif_entidade = e.nif_entidade
LEFT JOIN subquery_fornecedores 
    ON e.nif_entidade = subquery_fornecedores.nif_entidade
LEFT JOIN info_datasets id ON true

WHERE e.dt_referencia = (
        SELECT max(entidades_pt2030.dt_referencia)
        FROM pt2030.entidades_pt2030
      )
AND e.papel_entidade = 'Beneficiário Principal'
AND e.nif_entidade = $1::text

GROUP BY 
    e.nif_entidade,
    e.ds_entidade,
    subquery_nif.valor_financiamento,
    subquery_nif.valor_pago,
    subquery_nif.num_projetos,
    subquery_fornecedores.fornecedores_em_detalhe,
    id."sourceInfo";
`;

const queryProjectsByBeneficiarySheetOfPortugal2030 = `WITH projetos AS (
  SELECT
    e_2.cd_operacao,
    o.nome_operacao,
    o.dt_conclusao_efetiva,
    SUM(e_2.fundo_aprovado) AS valor_financiamento
  FROM pt2030.entidades_pt2030 e_2
  LEFT JOIN pt2030.operacoes_pt2030 o
    ON e_2.cd_operacao = o.cd_operacao
  WHERE
    o.dt_referencia = (
      SELECT MAX(dt_referencia)
      FROM pt2030.operacoes_pt2030
    )
  AND e_2.dt_referencia = (
      SELECT MAX(dt_referencia)
      FROM pt2030.entidades_pt2030
    )
  AND e_2.nif_entidade = $1::text
  AND e_2.papel_entidade = $2::text
  GROUP BY
    e_2.cd_operacao,
    o.nome_operacao,
    o.dt_conclusao_efetiva
), total_count AS (
  SELECT COUNT(*) AS total
  FROM projetos
), paged_projects AS (
  SELECT
    p.cd_operacao,
    p.nome_operacao,
    p.dt_conclusao_efetiva,
    p.valor_financiamento
  FROM projetos p
  ORDER BY p.cd_operacao
  LIMIT $3::integer
  OFFSET $4::integer
)
SELECT jsonb_build_object(
  'data', COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'operationCode', paged_projects.cd_operacao,
        'operationName', paged_projects.nome_operacao,
        'effectiveConclusionDate', paged_projects.dt_conclusao_efetiva,
        'approvedValue', paged_projects.valor_financiamento
      )
    ),
    '[]'::jsonb
  ),
  'total', COALESCE((SELECT total FROM total_count), 0)
) AS result
FROM paged_projects;
`;

const queryBeneficiariesByProjectSheetOfPortugal2030 = `WITH latest_entity_reference AS (
  SELECT MAX(e.dt_referencia) AS max_dt_referencia
  FROM pt2030.entidades_pt2030 e
), base AS (
  SELECT
    e.ds_entidade AS nome,
    e.nif_entidade,
    e.fundo_aprovado,
    e.papel_entidade
  FROM pt2030.entidades_pt2030 e
  CROSS JOIN latest_entity_reference ler
  WHERE e.enquadramento = 'PT2030'::text
    AND e.dt_referencia = ler.max_dt_referencia
    AND e.cd_operacao = $1::text
), principais AS (
  SELECT
    b.nome,
    b.nif_entidade,
    SUM(b.fundo_aprovado) AS valor_financiamento
  FROM base b
  WHERE b.papel_entidade = 'Beneficiário Principal'::text
  GROUP BY b.nome, b.nif_entidade
), outros AS (
  SELECT
    b.nome,
    b.nif_entidade,
    SUM(b.fundo_aprovado) AS valor_financiamento
  FROM base b
  WHERE b.papel_entidade = 'Outros Beneficiários'::text
  GROUP BY b.nome, b.nif_entidade
), paged_data AS (
  SELECT nome, nif_entidade, valor_financiamento
  FROM (
    SELECT p.nome, p.nif_entidade, p.valor_financiamento, 'MAIN'::text AS type
    FROM principais p
    UNION ALL
    SELECT o.nome, o.nif_entidade, o.valor_financiamento, 'OTHER'::text AS type
    FROM outros o
  ) combined
  WHERE type = $2::text
  ORDER BY nome
  LIMIT $3::integer
  OFFSET $4::integer
)
SELECT jsonb_build_object(
  'data', COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'name', pd.nome,
        'entityNif', pd.nif_entidade,
        'financingAmount', pd.valor_financiamento
      )
    ),
    '[]'::jsonb
  ),
  'total', CASE 
    WHEN $2::text = 'MAIN' THEN (SELECT COUNT(*) FROM principais)
    WHEN $2::text = 'OTHER' THEN (SELECT COUNT(*) FROM outros)
    ELSE 0
  END
) AS result
FROM paged_data pd;
`;

// Projects
const queryProjectsOfPortugal2030 = `WITH valores_min_max AS (
    SELECT MIN(fundo_aprovado) AS valor_finan_min,
      MAX(fundo_aprovado) AS valor_finan_max,
      MIN(fundo_executado) AS valor_exec_min,
      MAX(fundo_executado) AS valor_exec_max,
      MIN(fundo_pago) AS valor_pago_min,
      MAX(fundo_pago) AS valor_pago_max,
      MIN(dt_conclusao_prevista) AS data_min,
      MAX(dt_conclusao_prevista) AS data_max
    FROM pt2030.operacoes_pt2030
  )
SELECT jsonb_build_object(
  'data', COALESCE(jsonb_agg(data_row), '[]'::jsonb),
  'filters', jsonb_build_object(
    'approvedValueMin', (SELECT valor_finan_min FROM valores_min_max),
    'approvedValueMax', (SELECT valor_finan_max FROM valores_min_max),
    'executedValueMin', (SELECT valor_exec_min FROM valores_min_max),
    'executedValueMax', (SELECT valor_exec_max FROM valores_min_max),
    'paidValueMin', (SELECT valor_pago_min FROM valores_min_max),
    'paidValueMax', (SELECT valor_pago_max FROM valores_min_max),
    'plannedConclusionDateMin', (SELECT data_min FROM valores_min_max),
    'plannedConclusionDateMax', (SELECT data_max FROM valores_min_max)
  )
) AS result
FROM (
  SELECT jsonb_build_object(
    'operationCode', o.cd_operacao,
    'operationName', o.nome_operacao,
    'programmeCode', o.cd_programa,
    'programmeName', o.ds_programa,
    'policyObjectiveCode', o.cd_objetivo_estrategico,
    'policyObjectiveName', o.ds_objetivo_estrategico,
    'specificObjectiveCode', o.cd_objetivo_especifico,
    'specificObjectiveShortName', o.sg_objetivo_especifico,
    'thematicAreaCode', o.cd_area_tematica,
    'thematicAreaName', o.ds_area_tematica,
    'fundCode', o.cd_fundo,
    'fundName', o.ds_fundo,
    'approvedValue', o.fundo_aprovado,
    'executedValue', o.fundo_executado,
    'paidValue', o.fundo_pago,
    'effectiveConclusionDate', o.dt_conclusao_efetiva,
    'plannedConclusionDate', o.dt_conclusao_prevista,
    'nutsiiOperationCode', opr.cd_nutsii_operacao,
    'nutsiiOperationName', opr.ds_nutsii_operacao,
    'nutsiiiOperationCode', opr.cd_nutsiii_operacao,
    'nutsiiiOperationName', opr.ds_nutsiii_operacao,
    'municipalityOperationCode', opr.cd_concelho_operacao,
    'municipalityOperationName', opr.ds_concelho_operacao
  ) AS data_row
  FROM pt2030.operacoes_pt2030 o
    -- One row per operation: an operation spans several regions/municipalities,
    -- so joining the regional table directly repeats it once per municipality.
    LEFT JOIN LATERAL (
      SELECT
        string_agg(DISTINCT r.cd_nutsii_operacao::text, ', ') AS cd_nutsii_operacao,
        string_agg(DISTINCT r.ds_nutsii_operacao::text, ', ') AS ds_nutsii_operacao,
        string_agg(DISTINCT r.cd_nutsiii_operacao::text, ', ') AS cd_nutsiii_operacao,
        string_agg(DISTINCT r.ds_nutsiii_operacao::text, ', ') AS ds_nutsiii_operacao,
        string_agg(DISTINCT r.cd_concelho_operacao::text, ', ') AS cd_concelho_operacao,
        string_agg(DISTINCT r.ds_concelho_operacao::text, ', ') AS ds_concelho_operacao
      FROM pt2030.operacoes_regionalizadas_pt2030 r
      WHERE r.cd_operacao = o.cd_operacao
    ) opr ON true
  WHERE ($1::text IS NULL OR LOWER(o.nome_operacao) LIKE LOWER('%' || $1::text || '%'))
    AND ($2::text IS NULL OR LOWER(o.cd_operacao) LIKE LOWER('%' || $2::text || '%'))
    AND ($3::text IS NULL OR o.ds_fundo = $3::text)
    AND ($4::text IS NULL OR o.ds_objetivo_estrategico = $4::text)
    AND ($5::text IS NULL OR o.ds_programa = $5::text)
    AND ($6::text IS NULL OR o.ds_area_tematica = $6::text)
    AND ($7::text IS NULL OR EXISTS (
      SELECT 1 FROM pt2030.operacoes_regionalizadas_pt2030 r
      WHERE r.cd_operacao = o.cd_operacao AND r.ds_nutsii_operacao = $7::text
    ))
    AND ($8::text IS NULL OR EXISTS (
      SELECT 1 FROM pt2030.operacoes_regionalizadas_pt2030 r
      WHERE r.cd_operacao = o.cd_operacao AND r.ds_concelho_operacao = $8::text
    ))
    AND ($9::text IS NULL OR LOWER(o.sg_objetivo_especifico) = LOWER($9::text))
    AND ($10::numeric IS NULL OR o.fundo_aprovado >= $10::numeric)
    AND ($11::numeric IS NULL OR o.fundo_aprovado <= $11::numeric)
    AND ($12::numeric IS NULL OR o.fundo_executado >= $12::numeric)
    AND ($13::numeric IS NULL OR o.fundo_executado <= $13::numeric)
    AND ($14::numeric IS NULL OR o.fundo_pago >= $14::numeric)
    AND ($15::numeric IS NULL OR o.fundo_pago <= $15::numeric)
    AND ($16::date IS NULL OR o.dt_conclusao_prevista >= $16::date)
    AND ($17::date IS NULL OR o.dt_conclusao_prevista <= $17::date)
  ORDER BY
    CASE WHEN $19 = 'asc' THEN
      CASE 
        WHEN $18 = 'approvedValue' THEN o.fundo_aprovado
        WHEN $18 = 'executedValue' THEN o.fundo_executado
        WHEN $18 = 'paidValue' THEN o.fundo_pago
        WHEN $18 = 'plannedConclusionDate' THEN EXTRACT(EPOCH FROM o.dt_conclusao_prevista)
      END
    END ASC,
    CASE WHEN $19 = 'desc' THEN
      CASE 
        WHEN $18 = 'approvedValue' THEN o.fundo_aprovado
        WHEN $18 = 'executedValue' THEN o.fundo_executado
        WHEN $18 = 'paidValue' THEN o.fundo_pago
        WHEN $18 = 'plannedConclusionDate' THEN EXTRACT(EPOCH FROM o.dt_conclusao_prevista)
      END
    END DESC,
    o.cd_operacao
  LIMIT $20
  OFFSET $21
) AS subquery;
`;

const queryProjectsOfPortugal2030Count = `
SELECT COUNT(DISTINCT (o.cd_operacao, o.nome_operacao)) AS total
FROM pt2030.operacoes_pt2030 o
  LEFT JOIN pt2030.operacoes_regionalizadas_pt2030 opr ON o.cd_operacao = opr.cd_operacao
WHERE ($1::text IS NULL OR LOWER(o.nome_operacao) LIKE LOWER('%' || $1::text || '%'))
  AND ($2::text IS NULL OR LOWER(o.cd_operacao) LIKE LOWER('%' || $2::text || '%'))
  AND ($3::text IS NULL OR o.ds_fundo = $3::text)
  AND ($4::text IS NULL OR o.ds_objetivo_estrategico = $4::text)
  AND ($5::text IS NULL OR o.ds_programa = $5::text)
  AND ($6::text IS NULL OR o.ds_area_tematica = $6::text)
  AND ($7::text IS NULL OR opr.ds_nutsii_operacao = $7::text)
  AND ($8::text IS NULL OR opr.ds_concelho_operacao = $8::text)
  AND ($9::text IS NULL OR LOWER(o.sg_objetivo_especifico) = LOWER($9::text))
  AND ($10::numeric IS NULL OR o.fundo_aprovado >= $10::numeric)
  AND ($11::numeric IS NULL OR o.fundo_aprovado <= $11::numeric)
  AND ($12::numeric IS NULL OR o.fundo_executado >= $12::numeric)
  AND ($13::numeric IS NULL OR o.fundo_executado <= $13::numeric)
  AND ($14::numeric IS NULL OR o.fundo_pago >= $14::numeric)
  AND ($15::numeric IS NULL OR o.fundo_pago <= $15::numeric)
  AND ($16::date IS NULL OR o.dt_conclusao_prevista >= $16::date)
  AND ($17::date IS NULL OR o.dt_conclusao_prevista <= $17::date);
`;

const queryProjectsOfPortugal2030TotalCount = `
SELECT COUNT(DISTINCT (cd_operacao, nome_operacao)) AS total
FROM pt2030.operacoes_pt2030;
`;

const queryProjectsOfPortugal2030SourceInfo = `WITH ref AS (
    SELECT GREATEST(
               (SELECT MAX(x.dt_referencia) FROM pt2030.entidades_pt2030 x),
               (SELECT MAX(x.dt_referencia) FROM pt2030.operacoes_pt2030 x),
      (SELECT MAX(x.dt_referencia) FROM pt2030.operacoes_regionalizadas_pt2030 x)
        ) AS reference_date
),
-- último recurso por tabela (um por cada table_name)
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
    JOIN metadata.datasets d ON r.dataset_id = d.id
    WHERE r.table_name IN ('operacoes_pt2030', 'operacoes_regionalizadas_pt2030')
      AND d.thematic_area = 'pt-pt2030'
    ORDER BY r.table_name, r.last_modified DESC
),
-- sourceInfo no mesmo estilo do teu exemplo
source_cte AS (
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'source',        lr.organization_acronym,
                'sourceLink',    lr.organization_page,
                'url',           lr.latest,
                'referenceDate', rd.reference_date,
                'modificationDate',  lr.last_modified,
                'publicationDate',     lr.published,
                'title',         lr.title,
                'format',        lr.format
            )
            ORDER BY lr.title
        ),
        '[]'::jsonb
    ) AS source_info
    FROM latest_resources lr
    CROSS JOIN ref rd
)
SELECT source_cte.source_info AS result
FROM source_cte;
`;
// Project Sheet
const queryProjectSheetOfPortugal2030 = `WITH latest_project_reference AS (
    SELECT max(o_1.dt_referencia) AS max_dt_referencia
      FROM pt2030.operacoes_pt2030 o_1
  ), latest_entity_reference AS (
    SELECT max(e.dt_referencia) AS max_dt_referencia
      FROM pt2030.entidades_pt2030 e
  ), latest_region_reference AS (
    SELECT max(o_1.dt_referencia) AS max_dt_referencia
      FROM pt2030.operacoes_regionalizadas_pt2030 o_1
  ), project_data AS (
    SELECT o_1.cd_operacao AS codigo_projeto,
      jsonb_build_object(
        'nome', o_1.nome_operacao,
        'sumario', o_1.finalidade,
        'objetivo_estrategico', o_1.ds_objetivo_estrategico,
        'objetivo_especifico', o_1.sg_objetivo_especifico,
        'modalidade', o_1.modalidade,
        'codigo_projeto', o_1.cd_operacao,
        'valor_financiamento', o_1.fundo_aprovado,
        'valor_executado', o_1.fundo_executado,
        'valor_pago', o_1.fundo_pago,
        'dt_inicio_prevista', o_1.dt_inicio_prevista,
        'dt_inicio_efetiva', o_1.dt_inicio_efetiva,
        'dt_conclusao_prevista', o_1.dt_conclusao_prevista,
        'dt_conclusao_efetiva', o_1.dt_conclusao_efetiva
      ) AS project_info,
      jsonb_build_object(
        'tab_nome', 'Candidaturas',
        'nota_final', o_1.nota_final_candidatura,
        'codigo_aviso', o_1.cd_aviso_operacao,
        'designacao_aviso', o_1.ds_aviso_operacao
      ) AS candidaturas
      FROM pt2030.operacoes_pt2030 o_1
        CROSS JOIN latest_project_reference lpr_1
    WHERE o_1.enquadramento = 'PT2030'::text
      AND o_1.dt_referencia = lpr_1.max_dt_referencia
      AND ($1::text IS NULL OR o_1.cd_operacao = $1::text)
  ), supplier_data AS (
    SELECT e.cd_operacao AS codigo_projeto,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'nif_entidade', e.nif_entidade,
            'nome', e.ds_entidade,
            'valor_financiamento', e.fundo_aprovado
          )
        ) FILTER (WHERE e.papel_entidade = 'Fornecedor'::text),
        '[]'::jsonb
      ) AS fornecedores
      FROM pt2030.entidades_pt2030 e
        CROSS JOIN latest_entity_reference ler
    WHERE e.enquadramento = 'PT2030'::text
      AND e.dt_referencia = ler.max_dt_referencia
    GROUP BY e.cd_operacao
  ), aggregated_data AS (
    SELECT or_1.cd_operacao,
      sum(or_1.fundo_aprovado) AS fundo_aprovado,
      sum(or_1.fundo_pago) AS fundo_pago,
      or_1.ds_concelho_operacao,
      or_1.ds_distrito_operacao,
      or_1.ds_nutsiii_operacao,
      or_1.ds_nutsii_operacao
      FROM pt2030.operacoes_regionalizadas_pt2030 or_1
        CROSS JOIN latest_project_reference lpr_1
    WHERE or_1.enquadramento = 'PT2030'::text
      AND or_1.dt_referencia = lpr_1.max_dt_referencia
      AND NOT (
        or_1.ds_concelho_operacao = '-'::text
        AND or_1.ds_distrito_operacao = '-'::text
        AND (or_1.ds_nutsiii_operacao = 'ZZZ'::text OR or_1.ds_nutsiii_operacao = '-'::text)
      )
    GROUP BY
      or_1.cd_operacao,
      or_1.ds_concelho_operacao,
      or_1.ds_distrito_operacao,
      or_1.ds_nutsiii_operacao,
      or_1.ds_nutsii_operacao
  ), undefined_aggregation AS (
    SELECT o_1.cd_operacao,
      sum(o_1.fundo_aprovado) AS fundo_aprovado
      FROM pt2030.operacoes_regionalizadas_pt2030 o_1
    WHERE o_1.ds_concelho_operacao = '-'::text
      AND o_1.ds_distrito_operacao = '-'::text
      AND (o_1.ds_nutsiii_operacao = 'ZZZ'::text OR o_1.ds_nutsiii_operacao = '-'::text)
    GROUP BY o_1.cd_operacao
  ), concelho_data AS (
    SELECT aggregated_data.cd_operacao,
      jsonb_build_object(
        'descricao', aggregated_data.ds_concelho_operacao,
        'valor_financiamento', aggregated_data.fundo_aprovado,
        'valor_pago', aggregated_data.fundo_pago
      ) AS distribuicao
      FROM aggregated_data
    WHERE aggregated_data.ds_concelho_operacao <> '-'::text
  ), distrito_data AS (
    SELECT aggregated_data.cd_operacao,
      jsonb_build_object(
        'descricao', aggregated_data.ds_distrito_operacao,
        'valor_financiamento', aggregated_data.fundo_aprovado,
        'valor_pago', aggregated_data.fundo_pago
      ) AS distribuicao
      FROM aggregated_data
    WHERE aggregated_data.ds_concelho_operacao = '-'::text
      AND aggregated_data.ds_distrito_operacao <> '-'::text
  ), subregiao_data AS (
    SELECT aggregated_data.cd_operacao,
      jsonb_build_object(
        'descricao', aggregated_data.ds_nutsiii_operacao,
        'valor_financiamento', aggregated_data.fundo_aprovado,
        'valor_pago', aggregated_data.fundo_pago
      ) AS distribuicao
      FROM aggregated_data
    WHERE aggregated_data.ds_concelho_operacao = '-'::text
      AND aggregated_data.ds_distrito_operacao = '-'::text
      AND (aggregated_data.ds_nutsiii_operacao <> ALL (ARRAY['ZZZ'::text, '-'::text]))
  ), regiao_data AS (
    SELECT aggregated_data.cd_operacao,
      jsonb_build_object(
        'descricao', aggregated_data.ds_nutsii_operacao,
        'valor_financiamento', aggregated_data.fundo_aprovado,
        'valor_pago', aggregated_data.fundo_pago
      ) AS distribuicao
      FROM aggregated_data
    WHERE aggregated_data.ds_concelho_operacao = '-'::text
      AND aggregated_data.ds_distrito_operacao = '-'::text
      AND (aggregated_data.ds_nutsiii_operacao = ANY (ARRAY['ZZZ'::text, '-'::text]))
      AND aggregated_data.ds_nutsii_operacao <> 'ZZ'::text
  )
SELECT jsonb_build_object(
    'codigo_projeto', p.codigo_projeto,
    'candidaturas', p.candidaturas,
    'nome', p.project_info ->> 'nome'::text,
    'sumario', p.project_info ->> 'sumario'::text,
    'modalidade', p.project_info ->> 'modalidade'::text,
    'codigo_projeto', p.project_info ->> 'codigo_projeto'::text,
    'valor_financiamento', p.project_info ->> 'valor_financiamento'::text,
    'valor_executado', p.project_info ->> 'valor_executado'::text,
    'valor_pago', p.project_info ->> 'valor_pago'::text,
    'dt_inicio_prevista', p.project_info ->> 'dt_inicio_prevista'::text,
    'dt_inicio_efetiva', p.project_info ->> 'dt_inicio_efetiva'::text,
    'dt_conclusao_prevista', p.project_info ->> 'dt_conclusao_prevista'::text,
    'dt_conclusao_efetiva', p.project_info ->> 'dt_conclusao_efetiva'::text,
    'objetivo_estrategico', p.project_info ->> 'objetivo_estrategico'::text,
    'objetivo_especifico', p.project_info ->> 'objetivo_especifico'::text,
    'fornecedores', COALESCE(s.fornecedores, '[]'::jsonb),
    'distribuicao_geografica',
      jsonb_build_array(
        jsonb_build_object(
          'tipo', 'concelho',
          'order', 4,
          'distribuicao', COALESCE(jsonb_agg(DISTINCT concelho_data.distribuicao) FILTER (WHERE concelho_data.distribuicao IS NOT NULL), '[]'::jsonb)
        ),
        jsonb_build_object(
          'tipo', 'distrito',
          'order', 3,
          'distribuicao', COALESCE(jsonb_agg(DISTINCT distrito_data.distribuicao) FILTER (WHERE distrito_data.distribuicao IS NOT NULL), '[]'::jsonb)
        ),
        jsonb_build_object(
          'tipo', 'subregiao',
          'order', 2,
          'distribuicao', COALESCE(jsonb_agg(DISTINCT subregiao_data.distribuicao) FILTER (WHERE subregiao_data.distribuicao IS NOT NULL), '[]'::jsonb)
        ),
        jsonb_build_object(
          'tipo', 'regiao',
          'order', 1,
          'distribuicao', COALESCE(jsonb_agg(DISTINCT regiao_data.distribuicao) FILTER (WHERE regiao_data.distribuicao IS NOT NULL), '[]'::jsonb)
        ),
        jsonb_build_object(
          'tipo', 'transversal',
          'pc_valor_executado', round(((p.project_info ->> 'valor_executado'::text)::numeric) / NULLIF((p.project_info ->> 'valor_financiamento'::text)::numeric, 0::numeric), 2),
          'distribuicao_indefinida', u.fundo_aprovado,
          'valor_financiamento_total', p.project_info ->> 'valor_financiamento'::text
        )
      ),
    'info_datasets',
      jsonb_build_array(
        jsonb_build_object(
          'source', d.organization_acronym,
          'source_link', d.organization_page,
          'reference_date', lrr.max_dt_referencia,
          'info',
            jsonb_build_array(
              jsonb_build_object(
                'title', r.title,
                'format', r.format,
                'url', r.latest,
                'publication_date', r.published,
                'modification_date', r.last_modified
              )
            )
        )
      )
) AS json_output
   FROM project_data p
     LEFT JOIN undefined_aggregation u ON p.codigo_projeto = u.cd_operacao
     LEFT JOIN supplier_data s ON p.codigo_projeto = s.codigo_projeto
     LEFT JOIN concelho_data ON p.codigo_projeto = concelho_data.cd_operacao
     LEFT JOIN distrito_data ON p.codigo_projeto = distrito_data.cd_operacao
     LEFT JOIN subregiao_data ON p.codigo_projeto = subregiao_data.cd_operacao
     LEFT JOIN regiao_data ON p.codigo_projeto = regiao_data.cd_operacao
     LEFT JOIN metadata.pt2030_delta_resources r ON r.table_name = 'operacoes_regionalizadas_pt2030'::text
     CROSS JOIN metadata.pt2030_delta_datasets d
     CROSS JOIN latest_region_reference lrr
  GROUP BY
    p.codigo_projeto,
    p.project_info,
    p.candidaturas,
    s.fornecedores,
    u.fundo_aprovado,
    d.organization_acronym,
    d.organization_page,
    lrr.max_dt_referencia,
    r.last_modified,
    r.title,
    r.format,
    r.latest,
    r.published;
`;

export {
  queryBeneficiariesAndProjectsFiltersOfPortugal2030,
  querySpecificObjectivesByPolicyObjectiveOfPortugal2030,
  // Beneficiaries
  queryBeneficiaryOfPortugal2030,
  queryBeneficiaryOfPortugal2030Count,
  queryBeneficiaryOfPortugal2030TotalCount,
  queryBeneficiaryOfPortugal2030SourceInfo,
  // Beneficiary Sheet
  queryBeneficiarySheetOfPortugal2030,
  queryProjectsByBeneficiarySheetOfPortugal2030,
  queryBeneficiariesByProjectSheetOfPortugal2030,
  // Projects
  queryProjectsOfPortugal2030,
  queryProjectsOfPortugal2030Count,
  queryProjectsOfPortugal2030TotalCount,
  queryProjectsOfPortugal2030SourceInfo,
  // Project Sheet
  queryProjectSheetOfPortugal2030,
};
