import { stitchSchemas } from '@graphql-tools/stitch';
import { PT2030Schema } from './fundo-europeu/pt2030';

export async function getAllSchemas() {

  const pt2030Schema = await PT2030Schema();


  return stitchSchemas({
    subschemas: [
      pt2030Schema,
    ],
  });
}
