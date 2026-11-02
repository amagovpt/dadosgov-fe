const dimensoesQuery = ` SELECT cd_dimensao_estruturante AS id,
    ds_dimensao_estruturante AS name,
    sum(montante_programado) AS amount,
        CASE
            WHEN cd_dimensao_estruturante = 'TD'::text THEN 'dimensions_digital_prr'::text
            WHEN cd_dimensao_estruturante = 'RE'::text THEN 'dimensions_resilience_prr'::text
            ELSE 'dimensions_climate_prr'::text
        END AS context,
        CASE
            WHEN cd_dimensao_estruturante = 'TD'::text THEN 'prr_digital'::text
            WHEN cd_dimensao_estruturante = 'RE'::text THEN 'prr_resilience'::text
            ELSE 'prr_climatic'::text
        END AS "idImage"
   FROM prr.investimentos
  WHERE dt_referencia = (( SELECT max(investimentos_1.dt_referencia) AS max
           FROM prr.investimentos investimentos_1))
  GROUP BY cd_dimensao_estruturante, ds_dimensao_estruturante;`;

export { dimensoesQuery };