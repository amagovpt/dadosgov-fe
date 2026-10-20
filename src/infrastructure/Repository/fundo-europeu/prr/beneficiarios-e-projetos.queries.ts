export const queryBeneficiariesAndProjectsFiltersOfPRR = `SELECT
    ARRAY_AGG(DISTINCT ds_dimensao_estruturante) AS dimensions,
    ARRAY_AGG(DISTINCT ds_componente) AS components,
    ARRAY_AGG(DISTINCT ds_investimento) AS investments,
    (
        SELECT ARRAY_AGG(DISTINCT ds_nutsii)
        FROM prr.projetos_regionalizados opr
  WHERE opr.ds_nutsii <> 'Extra-Regio Nuts II'
    ) AS regions,
    (
        SELECT ARRAY_AGG(DISTINCT ds_concelho)
        FROM prr.projetos_regionalizados opr
  WHERE opr.ds_concelho <> '-'
    ) AS municipalities
FROM prr.investimentos;
`;

export const querySpecificComponentsByDimensionsOfPRR = `WITH distinct_components AS (
    SELECT DISTINCT
        i.cd_componente,
        i.ds_componente
    FROM prr.investimentos i
    WHERE ($1::text IS NULL OR i.ds_dimensao_estruturante = $1::text)
)
SELECT COALESCE(
    jsonb_agg(
        jsonb_build_object(
            'code', c.cd_componente,
            'shortName', c.ds_componente
        )
        ORDER BY c.cd_componente
    ),
    '[]'::jsonb
) AS specific_components
FROM distinct_components c;`;

export const querySpecificInvestmentsByComponentsOfPRR = `WITH distinct_investimentos AS (
    SELECT DISTINCT
        i.cd_investimento,
        i.ds_investimento
    FROM prr.investimentos i
    WHERE ($1::text IS NULL OR i.ds_componente = $1::text)
)
SELECT COALESCE(
    jsonb_agg(
        jsonb_build_object(
            'code', c.cd_investimento,
            'shortName', c.ds_investimento
        )
        ORDER BY c.cd_investimento
    ),
    '[]'::jsonb
) AS specific_investments
FROM distinct_investimentos c;
`;

export const searchBeneficiariesPRRQuery = (orderBy: string) => `WITH base AS (
    SELECT *
    FROM prr.search_prr_beneficiaries_basecte f
    WHERE ($1::text IS NULL OR f."recipientId"::text = $1)
      AND ($2::text IS NULL OR f."recipientName" ILIKE '%' || $2 || '%')
      AND ($3::text IS NULL OR f."dsMunicipalities"::text = $3)
      AND ($4::text IS NULL OR f."dsNutsii"::text = $4)
      AND ($5::text IS NULL OR f."dimension"::text = $5)
      AND ($6::text IS NULL OR f."component"::text = $6)
      AND ($7::text IS NULL OR f."investment"::text = $7)
      AND ($8::numeric  IS NULL OR f."budget" >= $8)
      AND ($9::numeric  IS NULL OR f."budget" <= $9)
      AND ($10::numeric IS NULL OR f."paidBudget" >= $10)
      AND ($11::numeric IS NULL OR f."paidBudget" <= $11)
      AND ($12::int IS NULL OR f."numProjects" >= $12)
      AND ($13::int IS NULL OR f."numProjects" <= $13)
      AND (
        ($14 AND f."finalRecipient")
        OR ($15 AND f."intermediaryRecipient")
        OR ($16 AND f."supplierRecipient")
        OR ($17 AND f."partnerRecipient")
      )
),
por_entidade_tipo AS (
    SELECT
        "recipientId", "recipientName", "recipientType",
        MAX("budget")      AS budget,  
        MAX("paidBudget")  AS paid_budget,
        MAX("numProjects") AS num_projects
    FROM base
    GROUP BY "recipientId", "recipientName", "recipientType"
),
por_entidade AS (
    SELECT
        "recipientId",
        MAX("recipientName") AS "recipientName",
        jsonb_agg(jsonb_build_object(
            'entityRole',     "recipientType",
            'approvedValue',  budget,
            'paidValue',      paid_budget,
            'projectsAmount', num_projects
        ) ORDER BY "recipientType") AS values_by_type
    FROM por_entidade_tipo
    GROUP BY "recipientId"
)
SELECT
    (jsonb_build_object(
        'entityNif',    "recipientId",
        'entityName',   "recipientName",
        'valuesByType', values_by_type
    ), '[]'::jsonb) AS data
FROM por_entidade
ORDER BY ${orderBy}
LIMIT $18 OFFSET $19;
`;

export const searchBeneficiariesPRRCountQuery = `SELECT COUNT(*)::int AS total
FROM prr.search_prr_beneficiaries_basecte f
WHERE ($1::text IS NULL OR f."recipientId"::text = $1)
    AND ($2::text IS NULL OR f."recipientName" ILIKE '%' || $2::text || '%')
    AND ($3::text IS NULL OR f."dsMunicipalities"::text = $3)
    AND ($4::text IS NULL OR f."dsNutsii"::text = $4)
    AND ($5::text IS NULL OR f."dimension"::text = $5)
    AND ($6::numeric IS NULL OR f."budget" >= $6::numeric)
    AND ($7::numeric IS NULL OR f."budget" <= $7::numeric)
    AND ($8::numeric IS NULL OR f."paidBudget" >= $8::numeric)
    AND ($9::numeric IS NULL OR f."paidBudget" <= $9::numeric)
    AND ($10::int IS NULL OR f."numProjects" >= $10::int)
    AND ($11::int IS NULL OR f."numProjects" <= $11::int)
    AND (
        ($12::boolean AND f."finalRecipient")
        OR ($13::boolean AND f."intermediaryRecipient")
        OR ($14::boolean AND f."supplierRecipient")
        OR ($15::boolean AND f."partnerRecipient")
    );
`;

export const searchBeneficiariesPRRTotalQuery = `SELECT COUNT(*)::int AS total
FROM prr.search_prr_beneficiaries_basecte;
`;

export const searchBeneficiariesPRRFiltersQuery = `SELECT
    MIN("budget")::numeric AS "budgetMin",
    MAX("budget")::numeric AS "budgetMax",
    MIN("paidBudget")::numeric AS "paidBudgetMin",
    MAX("paidBudget")::numeric AS "paidBudgetMax",
    MIN("numProjects")::int AS "projectsAmountMin",
    MAX("numProjects")::int AS "projectsAmountMax"
FROM prr.search_prr_beneficiaries_basecte;
`;

// Beneficiary Projects By Type Query
export const beneficiaryRelatedProjectsPRRQuery = `WITH max_datas AS (
   SELECT
   (SELECT MAX(dt_referencia) FROM prr.projetos) AS max_projetos,
   (SELECT MAX(dt_referencia) FROM prr.entidades) AS max_entidades,
   (SELECT MAX(dt_referencia) FROM prr.contratos) AS max_contratos,
   (SELECT MAX(dt_referencia) FROM prr.entidades_contratos) AS max_entidades_contratos
  ), projetos AS (
         SELECT p.cd_projeto,
            p.dt_referencia,
            p.ds_projeto,
            p.sumario,
            p.valor_aprovado,
            p.valor_executado,
            p.subvencoes,
            p.emprestimos,
            p.nota_final_candidatura,
            p.cd_investimento,
            p.dt_prevista_conclusao,
            p.dt_efetiva_conclusao
           FROM prr.projetos p
          WHERE p.dt_referencia = (SELECT max_projetos FROM max_datas)
        ), entidades AS (
         SELECT e.cd_entidade,
            e.dt_referencia,
            e.nif_entidade,
            b.ds_entidade,
            e.papel_entidade,
            e.atividade_economica,
            b.localizacao_sede,
            e.perc_participacao,
            e.valor_contratado,
            e.valor_pago,
            e.cd_projeto
           FROM prr.entidades e
             JOIN (
        SELECT DISTINCT ON (z.cd_entidade)
               z.cd_entidade,
               z.ds_entidade,
               z.localizacao_sede
        FROM prr.entidades z
        WHERE z.dt_referencia = (SELECT max_entidades FROM max_datas)
  AND z.nif_entidade = $1::text
        ORDER BY 
            z.cd_entidade,
            length(z.ds_entidade),
            length(z.localizacao_sede)
    ) b ON e.cd_entidade = b.cd_entidade
          WHERE e.dt_referencia = (SELECT max_entidades AS max FROM max_datas)
    AND e.nif_entidade = $1::text
        ), entidade_contrato AS (
         SELECT entidades_contratos.cd_contrato,
            entidades_contratos.dt_referencia,
            entidades_contratos.ds_contrato,
            entidades_contratos.cd_entidade,
            entidades_contratos.ds_papel_entidade_contrato,
            entidades_contratos.valor_contrato
           FROM prr.entidades_contratos
          WHERE entidades_contratos.dt_referencia = (SELECT max_entidades_contratos AS max
                   FROM max_datas)
        ), contratos AS (
         SELECT contratos.cd_contrato,
            contratos.dt_referencia,
            contratos.ds_contrato,
            contratos.sumario,
            contratos.dt_assinatura_contrato,
            contratos.montante_contratualizado,
            contratos.cd_projeto,
            contratos.ds_projeto,
            contratos.perc_contrato_projeto,
            contratos.cd_base_gov
           FROM prr.contratos
          WHERE contratos.dt_referencia = (SELECT max_contratos AS max
                   FROM max_datas)
        ), entidade_projeto AS (
         SELECT a.nif_recipient,
            a.headquarters,
                CASE
                    WHEN a.economic_activity = '0'::text THEN NULL::text
                    ELSE a.economic_activity
                END AS economic_activity,
            a.recipient_name,
            a.budget,
            a.num_projects,
            a.total_participacoes_consorcios,
            a.consortium
           FROM ( SELECT entidades.nif_entidade AS nif_recipient,
                    entidades.localizacao_sede AS headquarters,
                    entidades.atividade_economica AS economic_activity,
                    entidades.ds_entidade AS recipient_name,
                        CASE
                            WHEN sum(ec.montante_contratualizado) IS NULL THEN sum(
                            CASE
                                WHEN entidades.perc_participacao IS NULL THEN entidades.valor_contratado
                                ELSE entidades.perc_participacao * entidades.valor_contratado / 100::numeric
                            END)
                            ELSE sum(ec.montante_contratualizado)
                        END AS budget,
                    count(DISTINCT
                        CASE
                            WHEN ec.consortium = 0 OR ec.consortium IS NULL THEN projetos.cd_projeto
                            ELSE NULL::text
                        END) AS num_projects,
                    count(DISTINCT consorcio.cd_contrato) AS total_participacoes_consorcios,
                    false AS consortium
                   FROM projetos
                     LEFT JOIN ( SELECT entidades_1.cd_entidade,
                            entidades_1.dt_referencia,
                            entidades_1.nif_entidade,
                            entidades_1.ds_entidade,
                            entidades_1.papel_entidade,
                            entidades_1.atividade_economica,
                            entidades_1.localizacao_sede,
                            entidades_1.perc_participacao,
                            entidades_1.valor_contratado,
                            entidades_1.cd_projeto
                           FROM entidades entidades_1) entidades ON projetos.cd_projeto = entidades.cd_projeto
                     LEFT JOIN ( SELECT consorcio_1.cd_projeto,
                            consorcio_1.cd_contrato,
                            unnest(string_to_array(consorcio_1.cd_entidade::character varying::text, '|'::text)) AS entidade_sep
                           FROM prr.consorcio consorcio_1) consorcio ON projetos.cd_projeto = consorcio.cd_projeto AND entidades.cd_entidade = consorcio.entidade_sep
                     LEFT JOIN ( SELECT ec_1.cd_entidade,
                            c.cd_projeto,
                            ec_1.cd_contrato,
                            ec_1.dt_referencia,
                            c.montante_contratualizado,
                            c.consortium
                           FROM prr.entidades_contratos ec_1
                             JOIN ( SELECT contratos.dt_referencia,
                                    contratos.cd_projeto,
                                    contratos.cd_contrato,
                                    max(contratos.montante_contratualizado) AS montante_contratualizado,
         CASE
          WHEN (contratos.cd_contrato IN ( SELECT consorcio_1.cd_contrato
             FROM prr.consorcio consorcio_1)) THEN 1
          ELSE 0
         END AS consortium
                                   FROM prr.contratos
                                  GROUP BY contratos.dt_referencia, contratos.cd_projeto, contratos.cd_contrato, contratos.montante_contratualizado) c ON ec_1.cd_contrato = c.cd_contrato AND c.dt_referencia = ec_1.dt_referencia) ec ON entidades.cd_entidade = ec.cd_entidade AND entidades.cd_projeto = ec.cd_projeto AND entidades.dt_referencia = ec.dt_referencia
                  WHERE entidades.ds_entidade <> ' '::text
                  GROUP BY entidades.ds_entidade, entidades.nif_entidade, entidades.localizacao_sede, entidades.atividade_economica
                UNION
                 SELECT consorcio.id AS nif_recipient,
                    consorcio.localizacao_sede AS headquarters,
                    consorcio.atividade_economica AS economic_activity,
                    consorcio.ds_consorcio AS recipient_name,
                    consorcio.valor_contrato AS budget,
                    count(projetos.cd_projeto) AS num_projects,
                    0 AS total_participacoes_consorcios,
                    true AS consortium
                   FROM projetos
                     JOIN ( SELECT a_1.id,
                            a_1.cd_entidade,
                            a_1.ds_consorcio,
                            a_1.ds_papel_entidade_contrato,
                            a_1.papel_entidade_projeto,
                            a_1.cd_base_gov,
                            a_1.cd_projeto,
                            a_1.montante_contratualizado,
                            a_1.perc_participacao,
                            a_1.valor_contratado,
                            a_1.valor_contrato,
                            a_1.dt_referencia,
                            max(b.atividade_economica) AS atividade_economica,
                            max(b.localizacao_sede) AS localizacao_sede
                           FROM prr.consorcio a_1
                             JOIN entidades b ON a_1.cd_projeto = b.cd_projeto
                          GROUP BY a_1.id, a_1.cd_entidade, a_1.ds_consorcio, a_1.ds_papel_entidade_contrato, a_1.papel_entidade_projeto, a_1.cd_base_gov, a_1.cd_projeto, a_1.montante_contratualizado, a_1.perc_participacao, a_1.valor_contratado, a_1.dt_referencia, a_1.valor_contrato) consorcio ON projetos.cd_projeto = consorcio.cd_projeto
                  WHERE consorcio.ds_consorcio <> ' '::text
                  GROUP BY consorcio.id, consorcio.localizacao_sede, consorcio.atividade_economica, consorcio.ds_consorcio, consorcio.valor_contrato) a
          ORDER BY a.budget DESC
        ), entidades_contratos_join AS (
  SELECT 
   ec.cd_entidade,
   c.cd_projeto,
   ec.cd_contrato,
   ec.dt_referencia,
   c.montante_contratualizado,
   CASE
    WHEN c.cd_contrato IN (
     SELECT cd_contrato FROM prr.consorcio
    ) THEN 1
    ELSE 0
   END AS consortium
  FROM prr.entidades_contratos ec
  JOIN prr.contratos c 
   ON ec.cd_contrato = c.cd_contrato
  WHERE ec.dt_referencia = (SELECT max_entidades_contratos FROM max_datas)
    AND c.dt_referencia = (SELECT max_contratos FROM max_datas)
  ), tmp_benef_finais AS (
         SELECT a.recipient_id,
            jsonb_agg(jsonb_build_object('id', a.code, 'name', a.description, 'amount', a.total_percentagem, 'paid', a.total_pago, 'date', a.end_date) ORDER BY a.total_percentagem DESC, a.end_date DESC) AS beneficiarios,
            count(DISTINCT a.code) AS num_projects
           FROM ( SELECT entidades.nif_entidade AS recipient_id,
                    entidades.ds_entidade AS recipient_name,
                    projetos.cd_projeto AS code,
                    projetos.ds_projeto AS description,
                        CASE
                            WHEN projetos.dt_efetiva_conclusao IS NULL THEN projetos.dt_prevista_conclusao
                            ELSE projetos.dt_efetiva_conclusao
                        END AS end_date,
                        CASE
                            WHEN entidades.perc_participacao IS NULL THEN entidades.valor_contratado
                            ELSE entidades.perc_participacao * projetos.valor_aprovado / 100::numeric
                        END AS total_percentagem,
                    entidades.valor_pago AS total_pago
                   FROM projetos
                     LEFT JOIN entidades ON projetos.cd_projeto = entidades.cd_projeto
                  WHERE entidades.papel_entidade = 'Beneficiário Direto'::text OR entidades.papel_entidade = 'Beneficiário Final'::text
      AND $2::text = 'beneficiary'
                  ORDER BY projetos.cd_projeto) a
          GROUP BY a.recipient_id
          ORDER BY a.recipient_id
        ), tmp_benef_intermediarios AS (
         SELECT a.recipient_id,
            jsonb_agg(jsonb_build_object('id', a.code, 'name', a.description, 'amount', a.total_percentagem, 'paid', a.total_pago, 'date', a.end_date) ORDER BY a.total_percentagem DESC, a.end_date DESC) AS beneficiarios,
            count(DISTINCT a.code) AS num_projects
           FROM ( SELECT entidades.nif_entidade AS recipient_id,
                    entidades.ds_entidade AS recipient_name,
                    projetos.cd_projeto AS code,
                    projetos.ds_projeto AS description,
                        CASE
                            WHEN projetos.dt_efetiva_conclusao IS NULL THEN projetos.dt_prevista_conclusao
                            ELSE projetos.dt_efetiva_conclusao
                        END AS end_date,
                        CASE
                            WHEN entidades.perc_participacao IS NULL THEN entidades.valor_contratado
                            ELSE entidades.perc_participacao * projetos.valor_aprovado / 100::numeric
                        END AS total_percentagem,
                    entidades.valor_pago AS total_pago
                   FROM projetos
                     LEFT JOIN entidades ON projetos.cd_projeto = entidades.cd_projeto
                  WHERE entidades.papel_entidade = 'Beneficiário Intermediário'::text
      AND $2::text = 'intermediary'
                  ORDER BY projetos.cd_projeto) a
          GROUP BY a.recipient_id
          ORDER BY a.recipient_id
        ), tmp_benef_fornecedores AS (
         SELECT a.recipient_id,
            jsonb_agg(jsonb_build_object('id', a.code, 'name', a.description, 'amount', a.total_percentagem, 'date', a.end_date) ORDER BY a.total_percentagem DESC, a.end_date DESC) AS beneficiarios,
            count(DISTINCT a.code) AS num_projects,
            a.consortium
           FROM (( SELECT entidades.nif_entidade AS recipient_id,
                    entidades.ds_entidade AS recipient_name,
                    projetos.cd_projeto AS code,
                    projetos.ds_projeto AS description,
                        CASE
                            WHEN projetos.dt_efetiva_conclusao IS NULL THEN projetos.dt_prevista_conclusao
                            ELSE projetos.dt_efetiva_conclusao
                        END AS end_date,
                        CASE
                            WHEN sum(ec.montante_contratualizado) IS NULL THEN sum(
                            CASE
                                WHEN entidades.perc_participacao IS NULL THEN entidades.valor_contratado
                                ELSE entidades.perc_participacao * entidades.valor_contratado / 100::numeric
                            END)
                            ELSE sum(ec.montante_contratualizado)
                        END AS total_percentagem,
                    false AS consortium
                   FROM projetos
                     LEFT JOIN entidades ON projetos.cd_projeto = entidades.cd_projeto
                     LEFT JOIN ( SELECT ec_1.cd_entidade,
                            c.cd_projeto,
                            ec_1.cd_contrato,
                            ec_1.dt_referencia,
                            c.montante_contratualizado,
                            c.consortium
                           FROM prr.entidades_contratos ec_1
                             JOIN ( SELECT contratos.dt_referencia,
                                    contratos.cd_projeto,
                                    contratos.cd_contrato,
                                    max(contratos.montante_contratualizado) AS montante_contratualizado,
CASE
 WHEN (contratos.cd_contrato IN ( SELECT consorcio.cd_contrato
    FROM prr.consorcio)) THEN 1
 ELSE 0
END AS consortium
                                   FROM prr.contratos
                                  GROUP BY contratos.dt_referencia, contratos.cd_projeto, contratos.cd_contrato, contratos.montante_contratualizado) c ON ec_1.cd_contrato = c.cd_contrato AND c.dt_referencia = ec_1.dt_referencia) ec ON entidades.cd_entidade = ec.cd_entidade AND entidades.cd_projeto = ec.cd_projeto AND entidades.dt_referencia = ec.dt_referencia
                  WHERE entidades.papel_entidade = 'Fornecedor'::text AND (ec.consortium = 0 OR ec.consortium IS NULL)
      AND $2::text = 'supplier'
                  GROUP BY entidades.nif_entidade, entidades.ds_entidade, projetos.cd_projeto, projetos.ds_projeto, projetos.dt_efetiva_conclusao, projetos.dt_prevista_conclusao, projetos.valor_aprovado, projetos.sumario
                  ORDER BY projetos.cd_projeto)
                UNION
                ( SELECT a_1.id AS recipient_id,
                    a_1.ds_consorcio AS recipient_name,
                    b.cd_projeto AS code,
                    b.ds_projeto AS description,
                        CASE
                            WHEN b.dt_efetiva_conclusao IS NULL THEN b.dt_prevista_conclusao
                            ELSE b.dt_efetiva_conclusao
                        END AS end_date,
                    a_1.valor_contrato AS total_percentagem,
                    true AS consortium
                   FROM prr.consorcio a_1
                     JOIN projetos b ON a_1.cd_projeto = b.cd_projeto
                  WHERE a_1.papel_entidade_projeto = 'Fornecedor'::text
      AND $2::text = 'supplier'
                  ORDER BY b.cd_projeto)) a
          GROUP BY a.recipient_id, a.consortium
          ORDER BY a.recipient_id
        ), tmp_parceiros AS (
         SELECT a.recipient_id,
            jsonb_agg(jsonb_build_object('id', a.code, 'name', a.description, 'date', a.end_date) ORDER BY a.end_date DESC) AS beneficiarios,
            count(DISTINCT a.code) AS num_projects
           FROM ( SELECT e.nif_entidade AS recipient_id,
                    p.cd_projeto AS code,
                    p.ds_projeto AS description,
                        CASE
                            WHEN p.dt_efetiva_conclusao IS NULL THEN p.dt_prevista_conclusao
                            ELSE p.dt_efetiva_conclusao
                        END AS end_date
                   FROM projetos p
                     JOIN entidades e ON p.cd_projeto = e.cd_projeto
                  WHERE e.papel_entidade = 'Parceiro'::text
      AND $2::text = 'partner') a
          GROUP BY a.recipient_id
        )
 SELECT entidade_projeto.nif_recipient AS "nif",
    CASE 
      WHEN $2::text = 'supplier' THEN COALESCE(tmp_benef_fornecedores.num_projects, 0)
      WHEN $2::text = 'beneficiary' THEN COALESCE(tmp_benef_finais.num_projects, 0)
      WHEN $2::text = 'intermediary' THEN COALESCE(tmp_benef_intermediarios.num_projects, 0)
      WHEN $2::text = 'partner' THEN COALESCE(tmp_parceiros.num_projects, 0)
      ELSE 0
    END AS total,
    CASE 
      WHEN $2::text = 'supplier' THEN tmp_benef_fornecedores.beneficiarios
      WHEN $2::text = 'beneficiary' THEN tmp_benef_finais.beneficiarios
      WHEN $2::text = 'intermediary' THEN tmp_benef_intermediarios.beneficiarios
      WHEN $2::text = 'partner' THEN tmp_parceiros.beneficiarios
      ELSE NULL::jsonb
    END AS "data"
   FROM entidade_projeto
     LEFT JOIN tmp_benef_fornecedores ON entidade_projeto.nif_recipient = tmp_benef_fornecedores.recipient_id
     LEFT JOIN tmp_benef_finais ON entidade_projeto.nif_recipient = tmp_benef_finais.recipient_id
     LEFT JOIN tmp_benef_intermediarios ON entidade_projeto.nif_recipient = tmp_benef_intermediarios.recipient_id
     LEFT JOIN tmp_parceiros ON entidade_projeto.nif_recipient = tmp_parceiros.recipient_id
  WHERE entidade_projeto.nif_recipient = $1::text
  ORDER BY entidade_projeto.num_projects DESC;
`;

// Beneficiry Sheet
export const beneficiarySheetPRRQuery = `WITH max_datas AS (
   SELECT
   (SELECT MAX(dt_referencia) FROM prr.projetos) AS max_projetos,
   (SELECT MAX(dt_referencia) FROM prr.entidades) AS max_entidades,
   (SELECT MAX(dt_referencia) FROM prr.contratos) AS max_contratos,
   (SELECT MAX(dt_referencia) FROM prr.entidades_contratos) AS max_entidades_contratos
  ), projetos AS (
         SELECT p.cd_projeto,
            p.dt_referencia,
            p.ds_projeto,
            p.sumario,
            p.valor_aprovado,
            p.valor_executado,
            p.subvencoes,
            p.emprestimos,
            p.nota_final_candidatura,
            p.cd_investimento,
            p.dt_prevista_conclusao,
            p.dt_efetiva_conclusao
           FROM prr.projetos p
          WHERE p.dt_referencia = (SELECT max_projetos FROM max_datas)
        ), entidades AS (
         SELECT e.cd_entidade,
            e.dt_referencia,
            e.nif_entidade,
            b.ds_entidade,
            e.papel_entidade,
            e.atividade_economica,
            b.localizacao_sede,
            e.perc_participacao,
            e.valor_contratado,
            e.valor_pago,
            e.cd_projeto
           FROM prr.entidades e
             JOIN (
        SELECT DISTINCT ON (z.cd_entidade)
               z.cd_entidade,
               z.ds_entidade,
               z.localizacao_sede
        FROM prr.entidades z
        WHERE z.dt_referencia = (SELECT max_entidades FROM max_datas) AND z.nif_entidade = $1::text
        ORDER BY 
            z.cd_entidade,
            length(z.ds_entidade),
            length(z.localizacao_sede)
    ) b ON e.cd_entidade = b.cd_entidade
          WHERE e.dt_referencia = (SELECT max_entidades AS max FROM max_datas) AND e.nif_entidade = $1::text
        ),
  entidade_contrato AS (
         SELECT entidades_contratos.cd_contrato,
            entidades_contratos.dt_referencia,
            entidades_contratos.ds_contrato,
            entidades_contratos.cd_entidade,
            entidades_contratos.ds_papel_entidade_contrato,
            entidades_contratos.valor_contrato
           FROM prr.entidades_contratos
          WHERE entidades_contratos.dt_referencia = (SELECT max_entidades_contratos AS max
                   FROM max_datas)
        ), contratos AS (
         SELECT contratos.cd_contrato,
            contratos.dt_referencia,
            contratos.ds_contrato,
            contratos.sumario,
            contratos.dt_assinatura_contrato,
            contratos.montante_contratualizado,
            contratos.cd_projeto,
            contratos.ds_projeto,
            contratos.perc_contrato_projeto,
            contratos.cd_base_gov
           FROM prr.contratos
          WHERE contratos.dt_referencia = (SELECT max_contratos AS max
                   FROM max_datas)
        ), entidade_projeto AS (
         SELECT a.nif_recipient,
            a.headquarters,
                CASE
                    WHEN a.economic_activity = '0'::text THEN NULL::text
                    ELSE a.economic_activity
                END AS economic_activity,
            a.recipient_name,
            a.budget,
            a.num_projects,
            a.total_participacoes_consorcios,
            a.consortium
           FROM ( SELECT entidades.nif_entidade AS nif_recipient,
                    entidades.localizacao_sede AS headquarters,
                    entidades.atividade_economica AS economic_activity,
                    entidades.ds_entidade AS recipient_name,
                        CASE
                            WHEN sum(ec.montante_contratualizado) IS NULL THEN sum(
                            CASE
                                WHEN entidades.perc_participacao IS NULL THEN entidades.valor_contratado
                                ELSE entidades.perc_participacao * entidades.valor_contratado / 100::numeric
                            END)
                            ELSE sum(ec.montante_contratualizado)
                        END AS budget,
                    count(DISTINCT
                        CASE
                            WHEN ec.consortium = 0 OR ec.consortium IS NULL THEN projetos.cd_projeto
                            ELSE NULL::text
                        END) AS num_projects,
                    count(DISTINCT consorcio.cd_contrato) AS total_participacoes_consorcios,
                    false AS consortium
                   FROM projetos
                     LEFT JOIN ( SELECT entidades_1.cd_entidade,
                            entidades_1.dt_referencia,
                            entidades_1.nif_entidade,
                            entidades_1.ds_entidade,
                            entidades_1.papel_entidade,
                            entidades_1.atividade_economica,
                            entidades_1.localizacao_sede,
                            entidades_1.perc_participacao,
                            entidades_1.valor_contratado,
                            entidades_1.cd_projeto
                           FROM entidades entidades_1) entidades ON projetos.cd_projeto = entidades.cd_projeto
                     LEFT JOIN ( SELECT consorcio_1.cd_projeto,
                            consorcio_1.cd_contrato,
                            unnest(string_to_array(consorcio_1.cd_entidade::character varying::text, '|'::text)) AS entidade_sep
                           FROM prr.consorcio consorcio_1) consorcio ON projetos.cd_projeto = consorcio.cd_projeto AND entidades.cd_entidade = consorcio.entidade_sep
                     LEFT JOIN ( SELECT ec_1.cd_entidade,
                            c.cd_projeto,
                            ec_1.cd_contrato,
                            ec_1.dt_referencia,
                            c.montante_contratualizado,
                            c.consortium
                           FROM prr.entidades_contratos ec_1
                             JOIN ( SELECT contratos.dt_referencia,
                                    contratos.cd_projeto,
                                    contratos.cd_contrato,
                                    max(contratos.montante_contratualizado) AS montante_contratualizado,
         CASE
          WHEN (contratos.cd_contrato IN ( SELECT consorcio_1.cd_contrato
             FROM prr.consorcio consorcio_1)) THEN 1
          ELSE 0
         END AS consortium
                                   FROM prr.contratos
                                  GROUP BY contratos.dt_referencia, contratos.cd_projeto, contratos.cd_contrato, contratos.montante_contratualizado) c ON ec_1.cd_contrato = c.cd_contrato AND c.dt_referencia = ec_1.dt_referencia) ec ON entidades.cd_entidade = ec.cd_entidade AND entidades.cd_projeto = ec.cd_projeto AND entidades.dt_referencia = ec.dt_referencia
                  WHERE entidades.ds_entidade <> ' '::text
                  GROUP BY entidades.ds_entidade, entidades.nif_entidade, entidades.localizacao_sede, entidades.atividade_economica
                UNION
                 SELECT consorcio.id AS nif_recipient,
                    consorcio.localizacao_sede AS headquarters,
                    consorcio.atividade_economica AS economic_activity,
                    consorcio.ds_consorcio AS recipient_name,
                    consorcio.valor_contrato AS budget,
                    count(projetos.cd_projeto) AS num_projects,
                    0 AS total_participacoes_consorcios,
                    true AS consortium
                   FROM projetos
                     JOIN ( SELECT a_1.id,
                            a_1.cd_entidade,
                            a_1.ds_consorcio,
                            a_1.ds_papel_entidade_contrato,
                            a_1.papel_entidade_projeto,
                            a_1.cd_base_gov,
                            a_1.cd_projeto,
                            a_1.montante_contratualizado,
                            a_1.perc_participacao,
                            a_1.valor_contratado,
                            a_1.valor_contrato,
                            a_1.dt_referencia,
                            max(b.atividade_economica) AS atividade_economica,
                            max(b.localizacao_sede) AS localizacao_sede
                           FROM prr.consorcio a_1
                             JOIN entidades b ON a_1.cd_projeto = b.cd_projeto
                          GROUP BY a_1.id, a_1.cd_entidade, a_1.ds_consorcio, a_1.ds_papel_entidade_contrato, a_1.papel_entidade_projeto, a_1.cd_base_gov, a_1.cd_projeto, a_1.montante_contratualizado, a_1.perc_participacao, a_1.valor_contratado, a_1.dt_referencia, a_1.valor_contrato) consorcio ON projetos.cd_projeto = consorcio.cd_projeto
                  WHERE consorcio.ds_consorcio <> ' '::text
                  GROUP BY consorcio.id, consorcio.localizacao_sede, consorcio.atividade_economica, consorcio.ds_consorcio, consorcio.valor_contrato) a
          ORDER BY a.budget DESC
        ), entidades_contratos_join AS (
  SELECT 
   ec.cd_entidade,
   c.cd_projeto,
   ec.cd_contrato,
   ec.dt_referencia,
   c.montante_contratualizado,
   CASE
    WHEN c.cd_contrato IN (
     SELECT cd_contrato FROM prr.consorcio
    ) THEN 1
    ELSE 0
   END AS consortium
  FROM prr.entidades_contratos ec
  JOIN prr.contratos c 
   ON ec.cd_contrato = c.cd_contrato
  WHERE ec.dt_referencia = (SELECT max_entidades_contratos FROM max_datas)
    AND c.dt_referencia = (SELECT max_contratos FROM max_datas)
  ), tmp_benef_finais AS (
         SELECT a.recipient_id,
            jsonb_agg(jsonb_build_object('id', a.code, 'name', a.description, 'amount', a.total_percentagem, 'paid', a.total_pago, 'date', a.end_date) ORDER BY a.total_percentagem DESC, a.end_date DESC) AS beneficiarios,
            count(DISTINCT a.code) AS num_projects
           FROM ( SELECT entidades.nif_entidade AS recipient_id,
                    entidades.ds_entidade AS recipient_name,
                    projetos.cd_projeto AS code,
                    projetos.ds_projeto AS description,
                        CASE
                            WHEN projetos.dt_efetiva_conclusao IS NULL THEN projetos.dt_prevista_conclusao
                            ELSE projetos.dt_efetiva_conclusao
                        END AS end_date,
                        CASE
                            WHEN entidades.perc_participacao IS NULL THEN entidades.valor_contratado
                            ELSE entidades.perc_participacao * projetos.valor_aprovado / 100::numeric
                        END AS total_percentagem,
                    entidades.valor_pago AS total_pago
                   FROM projetos
                     LEFT JOIN entidades ON projetos.cd_projeto = entidades.cd_projeto
                  WHERE entidades.papel_entidade = 'Beneficiário Direto'::text OR entidades.papel_entidade = 'Beneficiário Final'::text
                  ORDER BY projetos.cd_projeto) a
          GROUP BY a.recipient_id
          ORDER BY a.recipient_id
        ), tmp_benef_intermediarios AS (
         SELECT a.recipient_id,
            jsonb_agg(jsonb_build_object('id', a.code, 'name', a.description, 'amount', a.total_percentagem, 'paid', a.total_pago, 'date', a.end_date) ORDER BY a.total_percentagem DESC, a.end_date DESC) AS beneficiarios,
            count(DISTINCT a.code) AS num_projects
           FROM ( SELECT entidades.nif_entidade AS recipient_id,
                    entidades.ds_entidade AS recipient_name,
                    projetos.cd_projeto AS code,
                    projetos.ds_projeto AS description,
                        CASE
                            WHEN projetos.dt_efetiva_conclusao IS NULL THEN projetos.dt_prevista_conclusao
                            ELSE projetos.dt_efetiva_conclusao
                        END AS end_date,
                        CASE
                            WHEN entidades.perc_participacao IS NULL THEN entidades.valor_contratado
                            ELSE entidades.perc_participacao * projetos.valor_aprovado / 100::numeric
                        END AS total_percentagem,
                    entidades.valor_pago AS total_pago
                   FROM projetos
                     LEFT JOIN entidades ON projetos.cd_projeto = entidades.cd_projeto
                  WHERE entidades.papel_entidade = 'Beneficiário Intermediário'::text
                  ORDER BY projetos.cd_projeto) a
          GROUP BY a.recipient_id
          ORDER BY a.recipient_id
        ), tmp_values_by_entity_role AS (
    SELECT
        x.nif_recipient,
        jsonb_agg(
            jsonb_build_object(
                'entityRole', x.entity_role,
                'approvedValue', x.approved_value,
                'executedValue', x.executed_value,
                'percentageExecutedValue',
                    round(
                        x.executed_value / NULLIF(x.approved_value, 0::numeric),
                        2
                    )
            )
            ORDER BY x.entity_role
        ) AS values_by_entity_role
    FROM (
        
        -- Beneficiários e Parceiros
        
        SELECT
            e.nif_entidade AS nif_recipient,
            e.papel_entidade AS entity_role,

            sum(
                CASE
                    WHEN e.perc_participacao IS NULL
                        THEN e.valor_contratado
                    ELSE e.perc_participacao * p.valor_aprovado / 100::numeric
                END
            ) AS approved_value,

            sum(e.valor_pago) AS executed_value

        FROM projetos p
        JOIN entidades e
            ON p.cd_projeto = e.cd_projeto

        WHERE e.nif_entidade IS NOT NULL
          AND e.papel_entidade IS NOT NULL
          AND e.papel_entidade <> 'Fornecedor'

        GROUP BY
            e.nif_entidade,
            e.papel_entidade

        UNION ALL

        -- Fornecedores normais
        
        SELECT
            e.nif_entidade AS nif_recipient,
            e.papel_entidade AS entity_role,

            sum(
                CASE
                    WHEN ec.montante_contratualizado IS NULL THEN
                        CASE
                            WHEN e.perc_participacao IS NULL
                                THEN e.valor_contratado
                            ELSE e.perc_participacao * e.valor_contratado / 100::numeric
                        END
                    ELSE ec.montante_contratualizado
                END
            ) AS approved_value,

            sum(e.valor_pago) AS executed_value

        FROM projetos p
        JOIN entidades e
            ON p.cd_projeto = e.cd_projeto

        LEFT JOIN entidades_contratos_join ec
            ON e.cd_entidade = ec.cd_entidade
           AND e.cd_projeto = ec.cd_projeto
           AND e.dt_referencia = ec.dt_referencia

        WHERE e.nif_entidade IS NOT NULL
          AND e.papel_entidade = 'Fornecedor'
          AND (ec.consortium = 0 OR ec.consortium IS NULL)

        GROUP BY
            e.nif_entidade,
            e.papel_entidade

        UNION ALL
        
        -- Fornecedores
        
        SELECT
            c.id AS nif_recipient,
            c.papel_entidade_projeto AS entity_role,

            sum(c.valor_contrato) AS approved_value,

            NULL::numeric AS executed_value

        FROM prr.consorcio c
        JOIN projetos p
            ON c.cd_projeto = p.cd_projeto

        WHERE c.id IS NOT NULL
          AND c.papel_entidade_projeto = 'Fornecedor'

        GROUP BY
            c.id,
            c.papel_entidade_projeto
    ) x
    GROUP BY x.nif_recipient
)

 SELECT "nif",
    "name",
    "totalProjects",
    "budget",
    "location",
    "economicActivity",
    "beneficiaryForm",
    "valuesByEntityRole"
   FROM ( SELECT entidade_projeto.nif_recipient AS "nif",
            entidade_projeto.recipient_name AS "name",
            COALESCE(tmp_benef_finais.num_projects, 0) AS "totalProjects",
            COALESCE(entidade_projeto.budget, 0) AS "budget",
            entidade_projeto.headquarters AS "location",
            entidade_projeto.economic_activity AS "economicActivity",
            jsonb_build_object('nif', entidade_projeto.nif_recipient, 'name', entidade_projeto.recipient_name, 'totalProjects', COALESCE(entidade_projeto.num_projects, 0), 'location', entidade_projeto.headquarters, 'economicActivity', entidade_projeto.economic_activity, 'totalConsortiumParticipations', COALESCE(entidade_projeto.total_participacoes_consorcios, 0)) AS "beneficiaryForm",
   COALESCE(tmp_values_by_entity_role.values_by_entity_role, '[]'::jsonb) AS "valuesByEntityRole"
           FROM entidade_projeto
             LEFT JOIN tmp_benef_finais ON entidade_projeto.nif_recipient = tmp_benef_finais.recipient_id
             LEFT JOIN tmp_values_by_entity_role ON entidade_projeto.nif_recipient = tmp_values_by_entity_role.nif_recipient
        WHERE entidade_projeto.nif_recipient = $1::text
          ORDER BY entidade_projeto.num_projects DESC) f;
`;

const projectSheetPRRBaseQuery = `
WITH params AS (
    SELECT $1::text AS cd
),
projetos AS (
    SELECT p.cd_projeto,
           p.dt_referencia,
           p.ds_projeto,
           p.sumario,
           p.valor_aprovado,
           p.valor_executado,
           p.subvencoes,
           p.emprestimos,
           p.nota_final_candidatura,
           p.cd_investimento,
           p.dt_prevista_conclusao,
           p.dt_efetiva_conclusao,
           p.dt_inicio
    FROM prr.projetos p
    WHERE p.dt_referencia = (SELECT max(dt_referencia) FROM prr.projetos)
      AND p.cd_projeto = (SELECT cd FROM params)
),

entidades AS (
    SELECT e.cd_entidade,
           e.dt_referencia,
           e.nif_entidade,
           b.ds_entidade,
           e.papel_entidade,
           e.atividade_economica,
           e.localizacao_sede,
           sum(e.perc_participacao) AS perc_participacao,
           sum(e.valor_contratado)  AS valor_contratado,
           sum(e.valor_pago)        AS valor_pago,
           e.cd_projeto,
           false AS flg_consorcio
    FROM prr.entidades e
    JOIN (
        SELECT DISTINCT ON (z.cd_entidade)
               z.cd_entidade,
               z.ds_entidade
        FROM prr.entidades z
        WHERE z.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
          AND z.cd_entidade IN (
              SELECT cd_entidade
              FROM prr.entidades
              WHERE dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
                AND cd_projeto = (SELECT cd FROM params)
          )
        ORDER BY z.cd_entidade, length(z.ds_entidade)
    ) b ON e.cd_entidade = b.cd_entidade
    WHERE e.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
      AND e.cd_projeto = (SELECT cd FROM params)
    GROUP BY
        e.cd_entidade, e.dt_referencia, e.nif_entidade, b.ds_entidade,
        e.papel_entidade, e.atividade_economica, e.localizacao_sede, e.cd_projeto

    UNION

    SELECT a_1.id AS cd_entidade,
           a_1.dt_referencia,
           a_1.id AS nif_entidade,
           a_1.ds_consorcio AS ds_entidade,
           a_1.papel_entidade_projeto AS papel_entidade,
           max(b.atividade_economica) AS atividade_economica,
           max(b.localizacao_sede)    AS localizacao_sede,
           a_1.perc_participacao,
           a_1.valor_contrato AS valor_contratado,
           NULL::numeric AS valor_pago,
           a_1.cd_projeto,
           true AS flg_consorcio
    FROM prr.consorcio a_1
    JOIN prr.entidades b
      ON a_1.cd_projeto = b.cd_projeto
     AND a_1.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
    WHERE a_1.cd_projeto = (SELECT cd FROM params)
    GROUP BY
        a_1.id, a_1.cd_entidade, a_1.ds_consorcio, a_1.ds_papel_entidade_contrato,
        a_1.papel_entidade_projeto, a_1.cd_base_gov, a_1.cd_contrato, a_1.cd_projeto,
        a_1.montante_contratualizado, a_1.perc_participacao, a_1.valor_contrato, a_1.dt_referencia
),

exclusoes_entidades AS (
    SELECT (z.cd_contrato || z.cd_projeto) || z.cd_entidade AS chave
    FROM (
        SELECT consorcio.cd_projeto,
               unnest(string_to_array(consorcio.cd_entidade, '|'::text)) AS cd_entidade,
               consorcio.cd_contrato
        FROM prr.consorcio
        WHERE consorcio.dt_referencia = (SELECT max(dt_referencia) FROM prr.consorcio)
          AND consorcio.cd_projeto = (SELECT cd FROM params)
    ) z
),

tmp_contratos AS (
    SELECT a.cd_projeto,
           sum(a.montante_contratualizado) AS valor_contratos,
           count(DISTINCT a.cd_contrato)   AS numero_contratos,
           jsonb_agg(jsonb_build_object(
               'descricao_principal',   a.ds_entidade_adjudicante,
               'descricao_secundaria',  a.ds_entidade_adjudicataria,
               'descricao_valores',     a.montante_contratualizado,
               'link',                  a.link
           ) ORDER BY a.montante_contratualizado DESC) AS detalhe_contratos
    FROM (
        SELECT c.cd_contrato,
               c.ds_contrato,
               c.sumario,
               c.dt_assinatura_contrato,
               c.montante_contratualizado,
               c.cd_projeto,
               c.perc_contrato_projeto,
               CASE
                   WHEN COALESCE(c.cd_base_gov, ''::text) = ANY (ARRAY['0'::text, ''::text]) THEN ''::text
                   ELSE 'https://www.base.gov.pt/Base4/pt/detalhe/?type=contratos&id='::text || c.cd_base_gov
               END AS link,
               json_agg(
                   CASE WHEN ec.ds_papel_entidade_contrato = 'Adjudicante'::text THEN ec.ds_entidade ELSE NULL::text END
               ) FILTER (WHERE ec.ds_papel_entidade_contrato = 'Adjudicante'::text)  AS ds_entidade_adjudicante,
               json_agg(
                   CASE WHEN ec.ds_papel_entidade_contrato = 'Adjudicatário'::text THEN ec.ds_entidade ELSE NULL::text END
               ) FILTER (WHERE ec.ds_papel_entidade_contrato = 'Adjudicatário'::text) AS ds_entidade_adjudicataria
        FROM prr.contratos c
        JOIN prr.entidades_contratos ec ON c.cd_contrato = ec.cd_contrato
        WHERE c.dt_referencia  = (SELECT max(dt_referencia) FROM prr.contratos)
          AND ec.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades_contratos)
          AND c.cd_projeto = (SELECT cd FROM params)
        GROUP BY c.cd_contrato, c.ds_contrato, c.sumario, c.dt_assinatura_contrato,
                 c.montante_contratualizado, c.cd_projeto, c.perc_contrato_projeto, c.cd_base_gov
    ) a
    GROUP BY a.cd_projeto
),

tmp_entidades_contratos AS (
    SELECT e.cd_entidade,
           e.dt_referencia,
           e.nif_entidade,
           e.ds_entidade,
           e.papel_entidade,
           e.atividade_economica,
           e.localizacao_sede,
           e.perc_participacao,
           e.valor_contratado,
           e.valor_pago,
           e.cd_projeto,
           a.cd_contrato,
           a.valor_contrato,
           e.flg_consorcio,
           (a.cd_contrato || e.cd_projeto) || a.cd_entidade AS chave
    FROM entidades e
    LEFT JOIN (
        SELECT contratos.cd_projeto,
               contratos.cd_contrato
        FROM prr.contratos
        WHERE contratos.dt_referencia = (SELECT max(dt_referencia) FROM prr.contratos)
          AND contratos.cd_projeto = (SELECT cd FROM params)
    ) b ON e.cd_projeto = b.cd_projeto
    LEFT JOIN (
        SELECT entidades_contratos.cd_entidade,
               entidades_contratos.cd_contrato,
               entidades_contratos.dt_referencia,
               entidades_contratos.valor_contrato
        FROM prr.entidades_contratos
        WHERE entidades_contratos.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades_contratos)
    ) a ON e.cd_entidade = a.cd_entidade
       AND e.dt_referencia = a.dt_referencia
       AND b.cd_contrato = a.cd_contrato
),

investimentos AS (
    SELECT i.cd_dimensao_estruturante,
           i.ds_dimensao_estruturante,
           i.cd_componente,
           i.ds_componente,
           i.cd_investimento,
           i.ds_investimento
    FROM prr.investimentos i
    WHERE i.dt_referencia = (SELECT max(dt_referencia) FROM prr.investimentos)
),

tmp_criterios_atribuicao AS (
    SELECT a.cd_projeto,
           COALESCE(a.link_criterio_atribuicao, ''::text) AS link_criterio_atribuicao,
           jsonb_agg(a.ds_criterio_atribuicao) AS criterios
    FROM (
        SELECT c.cd_criterio_atribuicao,
               c.ds_criterio_atribuicao,
               c.cd_projeto,
               c.link_criterio_atribuicao
        FROM prr.criterios_atribuicao c
        WHERE c.dt_referencia = (SELECT max(dt_referencia) FROM prr.criterios_atribuicao)
          AND c.cd_projeto = (SELECT cd FROM params)
    ) a
    GROUP BY a.cd_projeto, a.link_criterio_atribuicao
),

tmp_benef_fornecedores AS (
    SELECT a.code,
           jsonb_agg(jsonb_build_object(
               'id',         a.recipient_id,
               'nome',       a.recipient_name,
               'descricao',  a.total_percentagem,
               'consortium', a.flg_consorcio::text
           ) ORDER BY a.total_percentagem DESC) AS beneficiarios
    FROM (
        SELECT e.nif_entidade AS recipient_id,
               e.ds_entidade  AS recipient_name,
               p.cd_projeto   AS code,
               p.ds_projeto   AS description,
               p.valor_aprovado AS total,
               CASE WHEN p.dt_efetiva_conclusao IS NULL THEN p.dt_prevista_conclusao
                    ELSE p.dt_efetiva_conclusao END AS end_date,
               p.sumario AS summary,
               sum(
                   CASE
                       WHEN e.cd_projeto = a1.cd_projeto AND e.cd_contrato = a1.cd_contrato AND e.cd_entidade = a1.cd_entidade
                           THEN a1.valor_contrato
                       ELSE CASE WHEN e.perc_participacao IS NULL THEN e.valor_contrato
                                 ELSE e.perc_participacao * e.valor_contrato / 100::numeric END
                   END
               ) AS total_percentagem,
               e.flg_consorcio
        FROM projetos p
        JOIN tmp_entidades_contratos e ON p.cd_projeto = e.cd_projeto
        LEFT JOIN exclusoes_entidades ex ON e.chave = ex.chave
        LEFT JOIN (
            SELECT DISTINCT ON (a_2.cd_projeto)
                   a_2.cd_contrato,
                   a_2.dt_referencia,
                   a_2.ds_contrato,
                   a_2.cd_entidade,
                   a_2.ds_entidade,
                   a_2.ds_papel_entidade_contrato,
                   a_2.valor_contrato,
                   a_2.cd_projeto
            FROM prr.entidades_especiais a_2
        ) a1 ON e.cd_projeto = a1.cd_projeto
            AND e.cd_contrato = a1.cd_contrato
            AND e.cd_entidade = a1.cd_entidade
        WHERE ex.chave IS NULL
          AND e.papel_entidade = 'Fornecedor'
        GROUP BY
            e.nif_entidade, e.ds_entidade, p.cd_projeto, p.ds_projeto,
            p.dt_efetiva_conclusao, p.dt_prevista_conclusao, p.valor_aprovado,
            p.sumario, e.flg_consorcio

        UNION

        SELECT d_e.nif_entidade AS recipient_id,
               d_e.ds_entidade  AS recipient_name,
               p.cd_projeto     AS code,
               p.ds_projeto     AS description,
               p.valor_aprovado AS total,
               CASE WHEN p.dt_efetiva_conclusao IS NULL THEN p.dt_prevista_conclusao
                    ELSE p.dt_efetiva_conclusao END AS end_date,
               p.sumario AS summary,
               sum(d_e.valor_contratado) AS total_percentagem,
               d_e.flg_consorcio
        FROM projetos p
        LEFT JOIN (
            SELECT DISTINCT e.cd_entidade, e.dt_referencia, e.nif_entidade, e.ds_entidade,
                   e.papel_entidade, e.atividade_economica, e.localizacao_sede,
                   e.perc_participacao, e.valor_contratado, e.valor_pago, e.cd_projeto,
                   e.cd_contrato, e.valor_contrato, e.flg_consorcio, e.chave
            FROM tmp_entidades_contratos e
        ) d_e ON p.cd_projeto = d_e.cd_projeto
        WHERE d_e.flg_consorcio IS TRUE
          AND d_e.papel_entidade = 'Fornecedor'::text
        GROUP BY d_e.nif_entidade, d_e.ds_entidade, p.cd_projeto, p.ds_projeto,
                 p.valor_aprovado, p.dt_efetiva_conclusao, p.dt_prevista_conclusao,
                 p.sumario, d_e.flg_consorcio
    ) a
    GROUP BY a.code, a.description, a.total, a.end_date, a.summary
),

tmp_benef_finais AS (
    SELECT a.code,
           jsonb_agg(jsonb_build_object(
               'id', a.recipient_id, 'nome', a.recipient_name,
               'descricao', a.total_percentagem, 'paid', a.paid
           ) ORDER BY a.total_percentagem DESC) AS beneficiarios
    FROM (
        SELECT e.nif_entidade AS recipient_id,
               b.ds_entidade  AS recipient_name,
               p.cd_projeto   AS code,
               p.ds_projeto   AS description,
               sum(p.valor_aprovado) AS total,
               COALESCE(p.dt_efetiva_conclusao, p.dt_prevista_conclusao) AS end_date,
               p.sumario AS summary,
               sum(CASE WHEN e.perc_participacao IS NULL THEN e.valor_contratado
                        ELSE e.perc_participacao * e.valor_contratado / 100::numeric END) AS total_percentagem,
               sum(CASE WHEN e.perc_participacao IS NULL THEN e.valor_pago
                        ELSE e.perc_participacao * e.valor_pago / 100::numeric END)        AS paid
        FROM prr.projetos p
        JOIN prr.entidades e
          ON p.cd_projeto = e.cd_projeto
         AND e.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
        JOIN (
            SELECT DISTINCT ON (x.cd_entidade) x.cd_entidade, x.ds_entidade
            FROM prr.entidades x
            WHERE x.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
              AND x.cd_entidade IN (
                  SELECT cd_entidade FROM prr.entidades
                  WHERE dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
                    AND cd_projeto = (SELECT cd FROM params)
              )
            ORDER BY x.cd_entidade, length(x.ds_entidade)
        ) b ON e.cd_entidade = b.cd_entidade
        WHERE e.papel_entidade = ANY (ARRAY['Beneficiário Direto', 'Beneficiário Final'])
          AND e.papel_entidade <> ALL (ARRAY['Parceiro', 'Fornecedor', 'Beneficiário Intermediário'])
          AND p.cd_projeto = (SELECT cd FROM params)
          AND e.cd_projeto = (SELECT cd FROM params)
        GROUP BY e.nif_entidade, b.ds_entidade, p.cd_projeto, p.ds_projeto,
                 p.valor_aprovado, p.dt_efetiva_conclusao, p.dt_prevista_conclusao, p.sumario
    ) a
    GROUP BY a.code, a.description, a.total, a.end_date, a.summary
),

tmp_benef_intermediarios AS (
    SELECT a.code,
           jsonb_agg(jsonb_build_object(
               'id', a.recipient_id, 'nome', a.recipient_name,
               'descricao', a.total_percentagem, 'paid', a.paid
           ) ORDER BY a.total_percentagem DESC) AS beneficiarios
    FROM (
        SELECT e.nif_entidade AS recipient_id,
               b.ds_entidade  AS recipient_name,
               p.cd_projeto   AS code,
               p.ds_projeto   AS description,
               sum(p.valor_aprovado) AS total,
               COALESCE(p.dt_efetiva_conclusao, p.dt_prevista_conclusao) AS end_date,
               p.sumario AS summary,
               sum(CASE WHEN e.perc_participacao IS NULL THEN e.valor_contratado
                        ELSE e.perc_participacao * e.valor_contratado / 100::numeric END) AS total_percentagem,
               NULL::numeric AS paid
        FROM prr.projetos p
        JOIN prr.entidades e
          ON p.cd_projeto = e.cd_projeto
         AND e.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
        JOIN (
            SELECT DISTINCT ON (x.cd_entidade) x.cd_entidade, x.ds_entidade
            FROM prr.entidades x
            WHERE x.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
              AND x.cd_entidade IN (
                  SELECT cd_entidade FROM prr.entidades
                  WHERE dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
                    AND cd_projeto = (SELECT cd FROM params)
              )
            ORDER BY x.cd_entidade, length(x.ds_entidade)
        ) b ON e.cd_entidade = b.cd_entidade
        WHERE e.papel_entidade = 'Beneficiário Intermediário'
          AND e.papel_entidade <> 'Parceiro'
          AND p.cd_projeto = (SELECT cd FROM params)
          AND e.cd_projeto = (SELECT cd FROM params)
        GROUP BY e.nif_entidade, b.ds_entidade, p.cd_projeto, p.ds_projeto,
                 COALESCE(p.dt_efetiva_conclusao, p.dt_prevista_conclusao), p.sumario
    ) a
    GROUP BY a.code, a.description, a.total, a.end_date, a.summary
),

tmp_parceiros AS (
    SELECT a.code,
           jsonb_agg(jsonb_build_object(
               'id', a.recipient_id, 'nome', a.recipient_name
           ) ORDER BY a.recipient_name) AS beneficiarios
    FROM (
        SELECT DISTINCT e.nif_entidade AS recipient_id,
               b.ds_entidade AS recipient_name,
               p.cd_projeto  AS code
        FROM prr.projetos p
        JOIN prr.entidades e
          ON p.cd_projeto = e.cd_projeto
         AND e.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
        JOIN (
            SELECT DISTINCT ON (x.cd_entidade) x.cd_entidade, x.ds_entidade
            FROM prr.entidades x
            WHERE x.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
              AND x.cd_entidade IN (
                  SELECT cd_entidade FROM prr.entidades
                  WHERE dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
                    AND cd_projeto = (SELECT cd FROM params)
              )
            ORDER BY x.cd_entidade, length(x.ds_entidade)
        ) b ON e.cd_entidade = b.cd_entidade
        WHERE e.papel_entidade = 'Parceiro'::text
          AND p.cd_projeto = (SELECT cd FROM params)
          AND e.cd_projeto = (SELECT cd FROM params)
    ) a
    GROUP BY a.code
),

contratos_contratacao AS (
    SELECT g.cd_projeto,
           g.id_entidade_principal,
           json_agg(jsonb_build_object(
               'descricao_principal',  g.descricao_principal,
               'valor_contratos',      g.valor_contratos,
               'numero_contratos',     g.numero_contratos,
               'descricao_secundaria', g.detalhe_contrato
           ) ORDER BY g.descricao_principal) AS first_prr_contracts
    FROM (
        SELECT ff_1.cd_projeto,
               ff_1.cd_entidade AS id_entidade_principal,
               ff_1.ds_entidade AS descricao_principal,
               sum(ff_1.valor_contrato) AS valor_contratos,
               count(DISTINCT ff_1.cd_contrato) AS numero_contratos,
               json_agg(json_build_object(
                   'nome', ff_1.fornecedor,
                   'valor', ff_1.valor::text,
                   'link', ff_1.link
               ) ORDER BY ff_1.valor DESC) AS detalhe_contrato
        FROM (
            SELECT array_to_string((string_to_array(a.cd_contrato, '/'::text))[2:2], ''::text, ''::text) AS cd_projeto,
                   a.cd_contrato,
                   a.cd_entidade,
                   a.ds_entidade,
                   a.valor_contrato,
                   eadju.fornecedor,
                   eadju.valor,
                   eadju.link
            FROM (
                SELECT ec.cd_contrato,
                       ec.ds_papel_entidade_contrato,
                       ec.cd_entidade,
                       ec.ds_entidade,
                       ec.valor_contrato
                FROM prr.entidades_contratos ec
                WHERE ec.ds_papel_entidade_contrato = 'Adjudicante'::text
                  AND ec.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades_contratos)
            ) a
            JOIN (
                SELECT array_to_string((string_to_array(ec.cd_contrato, '/'::text))[2:2], ''::text, ''::text) AS cd_proj,
                       ec.cd_contrato AS contrato,
                       CASE WHEN cons.ds_consorcio IS NULL THEN ec.ds_entidade ELSE cons.ds_consorcio END AS fornecedor,
                       sum(ec.valor_contrato) AS valor,
                       CASE
                           WHEN COALESCE(c.cd_base_gov, ''::text) = ANY (ARRAY['0'::text, ''::text]) THEN ''::text
                           ELSE 'https://www.base.gov.pt/Base4/pt/detalhe/?type=contratos&id='::text || c.cd_base_gov
                       END AS link
                FROM prr.entidades_contratos ec
                JOIN prr.contratos c ON ec.cd_contrato = c.cd_contrato
                LEFT JOIN prr.consorcio cons ON cons.cd_contrato = c.cd_contrato
                WHERE ec.ds_papel_entidade_contrato = 'Adjudicatário'::text
                  AND ec.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades_contratos)
                  AND c.dt_referencia  = (SELECT max(dt_referencia) FROM prr.contratos)
                GROUP BY ec.cd_contrato, c.cd_base_gov,
                         (CASE WHEN cons.ds_consorcio IS NULL THEN ec.ds_entidade ELSE cons.ds_consorcio END)
            ) eadju ON a.cd_contrato = eadju.contrato
        ) ff_1
        GROUP BY ff_1.cd_projeto, ff_1.ds_entidade, ff_1.cd_entidade
    ) g
    WHERE g.cd_projeto = (SELECT cd FROM params)
    GROUP BY g.cd_projeto, g.id_entidade_principal
),

dist_geo AS (
    SELECT tttt.code,
           jsonb_build_object(
               'valor_percentagem', tttt.valor_percentagem,
               'distribuicao', tttt.distribuicao,
               'distribuicao_indefinida',
                   CASE WHEN tttt.valor_total_indefinido IS NOT NULL
                        THEN jsonb_build_object('valor', tttt.valor_total_indefinido)
                        ELSE '{}'::jsonb END,
               'source', tsrc.fonte,
               'reference_date', tsrc.data_referencia,
               'info', tsrc.info
           ) AS distribuicao_geografica
    FROM (
        SELECT ttt.code,
               ttt.valor_percentagem,
               jsonb_agg(jsonb_build_object('tipo', ttt.tipo, 'divisoes', ttt.divisoes)
                         ORDER BY (CASE WHEN ttt.tipo = 'concelho'::text THEN 100
                                        WHEN ttt.tipo = 'sub-regi'::text THEN 10
                                        ELSE 1 END)
                        ) FILTER (WHERE ttt.divisoes IS NOT NULL) AS distribuicao,
               sum(ttt.valor_total_indefinido) AS valor_total_indefinido
        FROM (
            SELECT tt.titulo_divisao AS tipo,
                   tt.cd_projeto AS code,
                   tt.valor_percentagem,
                   jsonb_agg(jsonb_build_object('descricao', tt.descricao_total, 'valor', tt.valor_total)
                             ORDER BY tt.valor_total DESC, tt.descricao_total
                            ) FILTER (WHERE tt.descricao_nutsii !~~ '%Extra-%'::text) AS divisoes,
                   sum(tt.valor_total) FILTER (WHERE tt.descricao_nutsii ~~ '%Extra-%'::text) AS valor_total_indefinido
            FROM (
                SELECT tmp.cd_projeto,
                       tmp.cd_nutsii,
                       tmp.ds_nutsii,
                       tmp.level_label AS titulo_divisao,
                       tmp.level_parent AS descricao_nutsii,
                       tmp.level_description AS descricao_total,
                       sum(tmp.total) AS valor_total,
                       CASE WHEN sum(tmp.valor_executado) = 0::numeric OR sum(tmp.valor_aprovado) = 0::numeric
                            THEN 0::numeric
                            ELSE sum(tmp.valor_executado) / sum(tmp.valor_aprovado) END AS valor_percentagem
                FROM (
                    SELECT projetos_regionalizados.cd_projeto,
                           projetos_regionalizados.cd_nutsii,
                           projetos_regionalizados.ds_nutsii,
                           CASE
                               WHEN projetos_regionalizados.cd_concelho <> '-'::text THEN 'concelho'::text
                               WHEN projetos_regionalizados.cd_nutsiii  <> '-'::text THEN 'sub-regi'::text
                               ELSE 'regi'::text
                           END AS level_label,
                           CASE
                               WHEN projetos_regionalizados.cd_concelho <> '-'::text THEN projetos_regionalizados.cd_concelho
                               WHEN projetos_regionalizados.cd_distrito <> '-'::text THEN projetos_regionalizados.cd_distrito
                               WHEN projetos_regionalizados.cd_nutsiii  <> '-'::text THEN projetos_regionalizados.cd_nutsiii
                               ELSE projetos_regionalizados.cd_nutsii
                           END AS level_code,
                           CASE
                               WHEN projetos_regionalizados.cd_concelho <> '-'::text THEN projetos_regionalizados.ds_concelho
                               WHEN projetos_regionalizados.cd_distrito <> '-'::text THEN projetos_regionalizados.ds_distrito
                               WHEN projetos_regionalizados.cd_nutsiii  <> '-'::text THEN projetos_regionalizados.ds_nutsiii
                               ELSE projetos_regionalizados.ds_nutsii
                           END AS level_description,
                           projetos_regionalizados.ds_nutsii AS level_parent,
                           CASE
                               WHEN projetos_regionalizados.perc_valor_aprovado IS NULL THEN projetos.valor_aprovado
                               ELSE projetos_regionalizados.perc_valor_aprovado * projetos.valor_aprovado / 100::numeric
                           END AS total,
                           projetos.valor_executado,
                           projetos.valor_aprovado
                    FROM prr.projetos
                    JOIN prr.projetos_regionalizados
                      ON projetos.cd_projeto = projetos_regionalizados.cd_projeto
                    WHERE projetos_regionalizados.dt_referencia = (SELECT max(dt_referencia) FROM prr.projetos_regionalizados)
                      AND projetos.dt_referencia = (SELECT max(dt_referencia) FROM prr.projetos)
                      AND projetos.cd_projeto = (SELECT cd FROM params)                 -- filtro do projeto
                      AND projetos_regionalizados.cd_projeto = (SELECT cd FROM params)  -- filtro do projeto
                    ORDER BY projetos_regionalizados.cd_nutsii
                ) tmp
                GROUP BY tmp.cd_projeto, tmp.cd_nutsii, tmp.ds_nutsii,
                         tmp.level_label, tmp.level_parent, tmp.level_description
            ) tt
            GROUP BY tt.cd_projeto, tt.titulo_divisao, tt.valor_percentagem
            ORDER BY tt.cd_projeto, tt.titulo_divisao
        ) ttt
        GROUP BY ttt.code, ttt.valor_percentagem
        ORDER BY ttt.code, ttt.valor_percentagem
    ) tttt,
    (
        SELECT t2.fonte,
               t2.data_referencia,
               jsonb_agg(jsonb_build_object(
                   'title', t2.title, 'format', t2.format, 'url', t2.url,
                   'publication_date', t2.published, 'modification_date', t2.last_modified)) AS info
        FROM (
            SELECT t1.fonte, t1.url, t0.data_referencia, t1.last_modified,
                   t1.published, t1.title, t1.format
            FROM (SELECT max(o.dt_referencia) AS data_referencia
                  FROM prr.projetos_regionalizados o) t0,
                 (SELECT d.organization_acronym AS fonte,
                         r.latest AS url,
                         r.table_name,
                         r.last_modified::timestamp(0) without time zone AS last_modified,
                         r.published, r.title, r.format
                  FROM metadata.resources r
                  JOIN metadata.datasets d ON r.dataset_id = d.id
                  WHERE r.table_name = 'projetos_regionalizados'::text
                    AND d.thematic_area = 'pt-prr'::text) t1
        ) t2
        GROUP BY t2.fonte, t2.data_referencia
    ) tsrc
)

SELECT recipient_id,
    recipient_name,
    recipient_type,
    code,
    description,
    total_agg,
    executed,
    subventions,
    loans,
    end_date,
    summary,
    total,
    dimension_code,
    dimension,
    component_code,
    component,
    investment_code,
    investment,
    eu_prr_project_form,
    flg_consorcio,
    eu_prr_contracts,
    CASE
        WHEN recipient_type = 'Beneficiário Direto'::text THEN jsonb_build_object(
            'eu_prr_beneficiary_financing', eu_prr_beneficiary_financing,
            'eu_prr_projects_geo_distribution_financing', eu_prr_projects_geo_distribution_financing,
            'eu_prr_contest_and_contracts', eu_prr_contest_and_contracts,
            'eu_prr_contracts', eu_prr_contracts)
        WHEN link_criterio_atribuicao = ''::text THEN jsonb_build_object(
            'eu_prr_beneficiary_financing', eu_prr_beneficiary_financing,
            'eu_prr_projects_geo_distribution_financing', eu_prr_projects_geo_distribution_financing,
            'eu_prr_contest_and_contracts', eu_prr_contest_and_contracts,
            'eu_prr_contracts', eu_prr_contracts)
        ELSE jsonb_build_object(
            'eu_prr_beneficiary_financing', eu_prr_beneficiary_financing,
            'eu_prr_projects_geo_distribution_financing', eu_prr_projects_geo_distribution_financing,
            'eu_prr_contest_and_contracts', eu_prr_contest_and_contracts,
            'eu_prr_candidature', eu_prr_candidature,
            'eu_prr_contracts', eu_prr_contracts)
    END AS tabs
FROM (
    SELECT f.recipient_id,
        f.recipient_name,
        f.recipient_type,
        f.code,
        f.description,
        f.total_agg,
        f.executed,
        f.subventions,
        f.loans,
        f.end_date,
        f.summary,
        f.total,
        f.dimension_code,
        f.dimension,
        f.component_code,
        f.component,
        f.investment_code,
        f.investment,
        f.flg_consorcio,
        f.link_criterio_atribuicao,
        jsonb_build_object(
            'nome', f.description, 'valor_total_projeto', f.total_projeto,
            'financiamento_fundo_perdido', f.subventions, 'financiamento_emprestimos', f.loans,
            'valor_executado', f.executed, 'data_inicio', f.dt_inicio,
            'data_conclusao_prevista', f.end_date, 'dimensao', f.dimension,
            'sumario', f.summary, 'componente', f.component, 'investimento', f.investment
        ) AS eu_prr_project_form,
        jsonb_build_object(
            'tab_nome', 'Beneficiários',
            'lista', jsonb_build_object(
                'beneficiario', f.beneficiario,
                'beneficiario_intermedio', f.beneficiario_intermedio,
                'fornecedor', f.fornecedor,
                'parceiro', f.parceiro)
        ) AS eu_prr_beneficiary_financing,
        jsonb_build_object(
            'tab_nome', 'Distribuição geográfica', 'source', 'EMRP',
            'source_link', 'https://www.adcoesao.pt/'
        ) || f.eu_prr_projects_geo_distribution_financing AS eu_prr_projects_geo_distribution_financing,
        CASE
            WHEN f.detalhe_contratos IS NULL AND f.criterios IS NULL THEN NULL::jsonb
            ELSE jsonb_build_object(
                'tab_nome', 'Concursos e Contratos',
                'detalhe_contratos', f.detalhe_contratos,
                'criterios', f.criterios)
        END AS eu_prr_contest_and_contracts,
        jsonb_build_object(
            'tab_nome', 'Contratação pública',
            'valor_contratos', f.valor_contratos,
            'numero_contratos', f.numero_contratos,
            'detalhe_contratos', f.first_prr_contracts
        ) AS eu_prr_contracts,
        jsonb_build_object(
            'tab_nome', 'Candidaturas',
            'nota_final', f.nota_final_candidatura,
            'nota_base', f.nota_base,
            'link', f.link_criterio_atribuicao
        ) AS eu_prr_candidature
    FROM (
        SELECT e.nif_entidade AS recipient_id,
               e.ds_entidade  AS recipient_name,
               e.papel_entidade AS recipient_type,
               p.cd_projeto   AS code,
               p.ds_projeto   AS description,
               p.valor_aprovado AS total_agg,
               p.nota_final_candidatura,
               ''::text AS nota_base,
               p.valor_aprovado AS total_projeto,
               p.valor_executado AS executed,
               p.subvencoes AS subventions,
               p.emprestimos AS loans,
               CASE WHEN p.dt_efetiva_conclusao IS NULL THEN p.dt_prevista_conclusao
                    ELSE p.dt_efetiva_conclusao END AS end_date,
               p.dt_inicio,
               p.sumario AS summary,
               CASE WHEN e.perc_participacao IS NULL THEN e.valor_contratado
                    ELSE e.perc_participacao * e.valor_contratado / 100::numeric END AS total,
               i.cd_dimensao_estruturante AS dimension_code,
               i.ds_dimensao_estruturante AS dimension,
               i.cd_componente AS component_code,
               i.ds_componente AS component,
               i.cd_investimento AS investment_code,
               i.ds_investimento AS investment,
               tmp_benef_fornecedores.beneficiarios     AS fornecedor,
               tmp_benef_finais.beneficiarios           AS beneficiario,
               tmp_benef_intermediarios.beneficiarios   AS beneficiario_intermedio,
               tmp_parceiros.beneficiarios              AS parceiro,
               tmp_contratos.detalhe_contratos,
               tmp_contratos.valor_contratos,
               tmp_contratos.numero_contratos,
               tmp_criterios_atribuicao.criterios,
               tmp_criterios_atribuicao.link_criterio_atribuicao,
               dist_geo.distribuicao_geografica AS eu_prr_projects_geo_distribution_financing,
               e.flg_consorcio,
               contratos_contratacao.first_prr_contracts
        FROM projetos p
        JOIN entidades e ON p.cd_projeto = e.cd_projeto
        LEFT JOIN contratos_contratacao
               ON p.cd_projeto = contratos_contratacao.cd_projeto
              AND e.nif_entidade = contratos_contratacao.id_entidade_principal
        JOIN investimentos i ON p.cd_investimento = "substring"(i.cd_investimento, 4)
        LEFT JOIN dist_geo                   ON p.cd_projeto = dist_geo.code
        LEFT JOIN tmp_benef_fornecedores     ON p.cd_projeto = tmp_benef_fornecedores.code
        LEFT JOIN tmp_benef_finais           ON p.cd_projeto = tmp_benef_finais.code
        LEFT JOIN tmp_benef_intermediarios   ON p.cd_projeto = tmp_benef_intermediarios.code
        LEFT JOIN tmp_parceiros              ON p.cd_projeto = tmp_parceiros.code
        LEFT JOIN tmp_contratos              ON p.cd_projeto = tmp_contratos.cd_projeto
        LEFT JOIN tmp_criterios_atribuicao   ON p.cd_projeto = tmp_criterios_atribuicao.cd_projeto
        ORDER BY p.cd_projeto
    ) f
) ff;
`;

// Search Beneficiary Source Info
export const searchBeneficiarySourceInfoPRRQuery = `WITH ref AS (
    SELECT GREATEST(
               (SELECT MAX(x.dt_referencia) FROM prr.entidades x),
               (SELECT MAX(x.dt_referencia) FROM prr.projetos x),
      (SELECT MAX(x.dt_referencia) FROM prr.investimentos x),
      (SELECT MAX(x.dt_referencia) FROM prr.projetos_regionalizados x)
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
    WHERE r.table_name IN ('entidades', 'projetos', 'investimentos', 'projetos_regionalizados')
      AND d.thematic_area = 'pt-prr'
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

export const projectSheetPRRQuery = `${projectSheetPRRBaseQuery};`;

export const projectSheetPRRBeneficiaryFinancingQuery = `WITH projetos AS (
    SELECT *
    FROM prr.projetos p
    WHERE p.dt_referencia = (
        SELECT MAX(dt_referencia) FROM prr.projetos
    )
),

entidades AS (
    SELECT 
        e.cd_entidade,
        e.dt_referencia,
        e.nif_entidade,
        b.ds_entidade,
        e.papel_entidade,
        e.atividade_economica,
        e.localizacao_sede,
        SUM(e.perc_participacao) AS perc_participacao,
        SUM(e.valor_contratado) AS valor_contratado,
        SUM(e.valor_pago) AS valor_pago,
        e.cd_projeto,
        FALSE AS flg_consorcio
    FROM prr.entidades e
    JOIN (
        SELECT DISTINCT ON (cd_entidade)
               cd_entidade,
               ds_entidade
        FROM prr.entidades
        WHERE dt_referencia = (SELECT MAX(dt_referencia) FROM prr.entidades)
        ORDER BY cd_entidade, length(ds_entidade)
    ) b USING (cd_entidade)
    WHERE e.dt_referencia = (SELECT MAX(dt_referencia) FROM prr.entidades)
      AND e.papel_entidade = ANY (
            CASE $2::text
              WHEN 'beneficiary'             THEN ARRAY['Beneficiário Direto','Beneficiário Final']
              WHEN 'intermediaryBeneficiary' THEN ARRAY['Beneficiário Intermediário']
              WHEN 'partner'                 THEN ARRAY['Parceiro']
              WHEN 'supplier'                THEN ARRAY['Fornecedor']
              ELSE ARRAY['Beneficiário Direto','Beneficiário Final']
            END
          )
    GROUP BY e.cd_entidade, e.dt_referencia, e.nif_entidade,
             b.ds_entidade, e.papel_entidade,
             e.atividade_economica, e.localizacao_sede, e.cd_projeto

    UNION ALL

    SELECT 
        c.id,
        c.dt_referencia,
        c.id,
        c.ds_consorcio,
        c.papel_entidade_projeto,
        MAX(e.atividade_economica),
        MAX(e.localizacao_sede),
        c.perc_participacao,
        c.valor_contrato,
        NULL,
        c.cd_projeto,
        TRUE
    FROM prr.consorcio c
    JOIN prr.entidades e 
        ON c.cd_projeto = e.cd_projeto
    WHERE c.dt_referencia = (SELECT MAX(dt_referencia) FROM prr.consorcio)
   AND c.papel_entidade_projeto = ANY (
            CASE $2::text
              WHEN 'beneficiary'             THEN ARRAY['Beneficiário Direto','Beneficiário Final']
              WHEN 'intermediaryBeneficiary' THEN ARRAY['Beneficiário Intermediário']
              WHEN 'partner'                 THEN ARRAY['Parceiro']
              WHEN 'supplier'                THEN ARRAY['Fornecedor']
              ELSE ARRAY['Beneficiário Direto','Beneficiário Final']
            END
          )
    GROUP BY c.id, c.dt_referencia, c.ds_consorcio,
             c.papel_entidade_projeto, c.cd_projeto,
             c.perc_participacao, c.valor_contrato
),

elems AS (
    SELECT
        e.cd_projeto,
        e.nif_entidade,
        e.ds_entidade,
        e.perc_participacao,
        e.valor_contratado,
        e.valor_pago,
        CASE WHEN e.perc_participacao IS NULL
             THEN e.valor_contratado
             ELSE e.perc_participacao * e.valor_contratado / 100 END AS ord_desc
    FROM entidades e
    WHERE ($1::text IS NULL OR lower(e.cd_projeto) = lower($1::text))
),

cont_por_projeto AS (
    SELECT cd_projeto, COUNT(*) AS n
    FROM elems
    GROUP BY cd_projeto
),

com_cum AS (
    SELECT
        cd_projeto,
        n,
        COALESCE(
            SUM(n) OVER (ORDER BY cd_projeto
                         ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING),
            0
        ) AS cum_ini
    FROM cont_por_projeto
),

projetos_janela AS (
    SELECT cd_projeto, cum_ini
    FROM com_cum
    WHERE cum_ini < COALESCE($4::int, 0) + COALESCE($3::int, 2147483647)
      AND cum_ini + n > COALESCE($4::int, 0)
),

janela AS (
    SELECT
        jsonb_build_object(
            'id',   e.nif_entidade,
            'name', e.ds_entidade,
            'description', CASE WHEN e.perc_participacao IS NULL
                                THEN e.valor_contratado
                                ELSE e.perc_participacao * e.valor_contratado / 100 END,
            'paid', CASE WHEN e.perc_participacao IS NULL
                         THEN e.valor_pago
                         ELSE e.perc_participacao * e.valor_pago / 100 END
        ) AS elem,
        pj.cum_ini + row_number() OVER (
            PARTITION BY e.cd_projeto
            ORDER BY e.ord_desc DESC NULLS LAST, e.nif_entidade
        ) AS rn
    FROM projetos_janela pj
    JOIN elems e ON e.cd_projeto = pj.cd_projeto
)

SELECT
    COALESCE(
        jsonb_agg(elem ORDER BY rn) FILTER (
            WHERE rn > COALESCE($4::int, 0)
              AND ($3::int IS NULL OR rn <= COALESCE($4::int, 0) + $3::int)
        ),
        '[]'::jsonb
    ) AS eu_prr_beneficiary_financing,
    (SELECT COALESCE(SUM(n), 0)::int FROM cont_por_projeto) AS total
FROM janela;
`;

// Search Projects

export const searchProjectsOfPRRQuery = ` 
SELECT prr.search_projects_optimized(
    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
  ) AS result;`;

export const searchProjectsOfPRRCountQuery = `WITH milestones_targets_ids AS (
    SELECT reforma_investimento
    FROM prr.milestones_targets
    GROUP BY reforma_investimento
)
SELECT COUNT(*)::int AS total
FROM (
    SELECT DISTINCT
        f.code, f.consortium, f.from_consortium, f.benef_type
    FROM (
        SELECT
            p.cd_projeto AS code,
            false AS consortium,
            COALESCE(consorcio.from_consortium, false) AS from_consortium,
            CASE
                WHEN e.papel_entidade = ANY (ARRAY['Beneficiário Direto'::text,'Beneficiário Final'::text]) THEN 'beneficiary'::text
                WHEN e.papel_entidade = 'Beneficiário Intermediário'::text THEN 'intermediate_beneficiary'::text
                WHEN e.papel_entidade = 'Fornecedor'::text THEN 'provider'::text
                ELSE NULL::text
            END AS benef_type,
            i.ds_dimensao_estruturante AS dimension,
            p.valor_aprovado AS budget,
            CASE WHEN p.dt_efetiva_conclusao IS NULL THEN p.dt_prevista_conclusao
                 ELSE p.dt_efetiva_conclusao END AS end_date,
            p.ds_projeto AS description,
            r.ds_nutsii,
            r.ds_concelho
        FROM prr.projetos p
        JOIN prr.investimentos i ON p.cd_investimento = "substring"(i.cd_investimento, 4)
        JOIN prr.entidades e ON p.cd_projeto = e.cd_projeto
        JOIN milestones_targets_ids mt ON mt.reforma_investimento = i.cd_investimento
        LEFT JOIN (
            SELECT consorcio_1.cd_projeto,
                   unnest(string_to_array(consorcio_1.cd_entidade, '|'::text)) AS sep_cd_entidade,
                   true AS from_consortium
            FROM prr.consorcio consorcio_1
        ) consorcio ON p.cd_projeto = consorcio.cd_projeto AND e.cd_entidade = consorcio.sep_cd_entidade
        LEFT JOIN prr.projetos_regionalizados r ON p.cd_projeto = r.cd_projeto
        WHERE p.dt_referencia = (SELECT max(dt_referencia) FROM prr.projetos)
          AND i.dt_referencia = (SELECT max(dt_referencia) FROM prr.investimentos)
          AND e.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
          AND e.papel_entidade = ANY (ARRAY['Beneficiário Direto'::text,'Beneficiário Final'::text])

        UNION ALL

        SELECT
            p.cd_projeto, true, false,
            CASE
                WHEN e.papel_entidade_projeto = ANY (ARRAY['Beneficiário Direto'::text,'Beneficiário Final'::text]) THEN 'beneficiary'::text
                WHEN e.papel_entidade_projeto = 'Beneficiário Intermediário'::text THEN 'intermediate_beneficiary'::text
                WHEN e.papel_entidade_projeto = 'Fornecedor'::text THEN 'provider'::text
                ELSE NULL::text
            END,
            i.ds_dimensao_estruturante,
            p.valor_aprovado,
            CASE WHEN p.dt_efetiva_conclusao IS NULL THEN p.dt_prevista_conclusao
                 ELSE p.dt_efetiva_conclusao END,
            p.ds_projeto,
            r.ds_nutsii,
            r.ds_concelho
        FROM prr.projetos p
        JOIN prr.investimentos i ON p.cd_investimento = "substring"(i.cd_investimento, 4)
        JOIN prr.consorcio e ON p.cd_projeto = e.cd_projeto
        JOIN milestones_targets_ids mt ON mt.reforma_investimento = i.cd_investimento
        LEFT JOIN prr.projetos_regionalizados r ON p.cd_projeto = r.cd_projeto
        WHERE p.dt_referencia = (SELECT max(dt_referencia) FROM prr.projetos)
          AND i.dt_referencia = (SELECT max(dt_referencia) FROM prr.investimentos)
          AND e.dt_referencia = (SELECT max(dt_referencia) FROM prr.entidades)
          AND e.papel_entidade_projeto = ANY (ARRAY['Beneficiário Direto'::text,'Beneficiário Final'::text])
    ) f
    WHERE ($1::text    IS NULL OR f.code::text = $1)
      AND ($2::text    IS NULL OR f.description ILIKE '%' || $2::text || '%')
      AND ($3::text    IS NULL OR f.dimension = $3)
      AND ($4::text    IS NULL OR f.ds_nutsii = $4)
      AND ($5::text    IS NULL OR f.ds_concelho = $5)
      AND ($6::numeric IS NULL OR f.budget >= $6::numeric)
      AND ($7::numeric IS NULL OR f.budget <= $7::numeric)
      AND ($8::date    IS NULL OR f.end_date >= $8::date)
      AND ($9::date    IS NULL OR f.end_date <= $9::date)
) d;
`;

export const searchProjectsOfPRRTotalQuery = `
SELECT COUNT(*) AS total
FROM (
  SELECT DISTINCT cd_projeto, cd_investimento
  FROM prr.projetos p
) AS unique_entities;
`;

// Headline numbers for the projects page, taken from the latest snapshot
export const searchProjectsOfPRRTotalsQuery = `
SELECT
  COUNT(DISTINCT p.cd_projeto)::int AS projects,
  COALESCE(SUM(p.valor_aprovado), 0)::float8 AS approved_value,
  COALESCE(SUM(p.valor_executado), 0)::float8 AS executed_value,
  MIN(COALESCE(p.dt_efetiva_conclusao, p.dt_prevista_conclusao))::text AS end_date_min,
  MAX(COALESCE(p.dt_efetiva_conclusao, p.dt_prevista_conclusao))::text AS end_date_max
FROM prr.projetos p
WHERE p.dt_referencia = (SELECT MAX(dt_referencia) FROM prr.projetos);
`;

export const searchProjectsOfPRRSourceInfoQuery = `WITH ref AS (
    SELECT MAX(dt_referencia) AS reference_date
    FROM prr.projetos
),
latest_resources AS (
    SELECT DISTINCT ON (d.id)
        d.title,
        d.organization_acronym,
        d.organization_page,
        r.latest,
        r.last_modified,
        r.published,
        r.format
    FROM metadata.datasets d
    JOIN metadata.resources r 
        ON r.dataset_id = d.id
    WHERE d.thematic_area = 'pt-prr'
      AND r.table_name IN ('projetos', 'projetos_regionalizados', 'investimentos', 'entidades')
    ORDER BY d.id, r.last_modified DESC
)
SELECT json_agg(jsonb_build_object(
    'source', lr.organization_acronym,
    'sourceLink', lr.organization_page,
    'url', lr.latest,
    'referenceDate', r.reference_date,
    'lastModified', lr.last_modified,
    'published', lr.published,
    'title', lr.title,
    'format', lr.format
)) AS sourceInfo
FROM latest_resources lr
CROSS JOIN ref r;
`;

export const queryBeneficiarySheetSourceInfo = `WITH latest_ref_projetos AS (
    SELECT MAX(dt_referencia) AS dt_referencia FROM prr.projetos WHERE dt_referencia IS NOT NULL
),
latest_ref_entidades AS (
    SELECT MAX(dt_referencia) AS dt_referencia FROM prr.entidades WHERE dt_referencia IS NOT NULL
),
latest_ref_contratos AS (
    SELECT MAX(dt_referencia) AS dt_referencia FROM prr.contratos WHERE dt_referencia IS NOT NULL
),
latest_ref_entidades_contratos AS (
    SELECT MAX(dt_referencia) AS dt_referencia FROM prr.entidades_contratos WHERE dt_referencia IS NOT NULL
),
latest_ref_consorcio AS (
    SELECT MAX(dt_referencia) AS dt_referencia FROM prr.consorcio WHERE dt_referencia IS NOT NULL
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
    JOIN metadata.datasets d ON r.dataset_id = d.id
    WHERE r.table_name IN ('projetos', 'entidades', 'contratos', 'entidades_contratos', 'consorcio')
      AND d.thematic_area = 'pt-prr'
    ORDER BY r.table_name, r.last_modified DESC
)
SELECT COALESCE(
    jsonb_agg(
        jsonb_build_object(
            'source',                          lr.organization_acronym,
            'sourceLink',                      lr.organization_page,
            'url',                             lr.latest,
            'referenceDateProjetos',           (SELECT dt_referencia FROM latest_ref_projetos),
            'referenceDateEntidades',          (SELECT dt_referencia FROM latest_ref_entidades),
            'referenceDateContratos',          (SELECT dt_referencia FROM latest_ref_contratos),
            'referenceDateEntidadesContratos', (SELECT dt_referencia FROM latest_ref_entidades_contratos),
            'referenceDateConsorcio',          (SELECT dt_referencia FROM latest_ref_consorcio),
            'modificationDate',                lr.last_modified,
            'publicationDate',                 lr.published,
            'title',                           lr.title,
            'format',                          lr.format
        )
        ORDER BY lr.title
    ),
    '[]'::jsonb
) AS sourceInfo
FROM latest_resources lr;
`;
