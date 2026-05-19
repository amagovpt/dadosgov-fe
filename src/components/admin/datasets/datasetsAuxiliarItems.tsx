import React from "react";
import { AuxiliarItem } from "@/components/admin/AuxiliarList";
import { AppLink } from "@/components/Primitives/AppLink";

interface DatasetAuxiliarErrors {
  title?: boolean;
  description?: boolean;
  frequency?: boolean;
}

export function getDatasetAuxiliarItems(errors: DatasetAuxiliarErrors = {}): AuxiliarItem[] {
  return [
    {
      title: "Dar um título",
      content: (
        <>
          <p>O título do seu conjunto de dados deve ser o mais preciso e específico possível.</p>
          <p>
            Deve também corresponder ao vocabulário utilizado pelos utilizadores que, na maioria das
            vezes, procuram dados através de um motor de pesquisa.
          </p>
        </>
      ),
      hasError: !!errors.title,
    },
    {
      title: "Adicionar uma sigla",
      content: (
        <p>
          Tem a opção de adicionar uma sigla ao seu conjunto de dados. As letras que compõem a sigla
          não precisam de ser separadas por pontos.
        </p>
      ),
    },
    {
      title: "Descrever os dados",
      content: (
        <>
          <p>
            A descrição do seu conjunto de dados permite que os utilizadores obtenham informações
            sobre o conteúdo e a estrutura dos recursos publicados; pode, em particular, fornecer
            informações como:
          </p>
          <ul className="pl-5 mt-2 flex list-disc flex-col gap-2">
            <li>A lista de ficheiros disponibilizados;</li>
            <li>A descrição do formato do ficheiro;</li>
            <li>A frequência de atualização;</li>
          </ul>
          <ul className="pl-5 mt-4 flex list-disc flex-col gap-2">
            <li>As motivações para a criação do conjunto de dados;</li>
            <li>A composição do conjunto de dados;</li>
            <li>O processo de recolha de dados;</li>
            <li>O pré-processamento de dados;</li>
            <li>A distribuição do conjunto de dados;</li>
            <li>A manutenção de conjuntos de dados;</li>
            <li>As considerações legais e éticas.</li>
          </ul>
        </>
      ),
      hasError: !!errors.description,
    },
    {
      title: "Incluir uma descrição breve",
      hidden: true,
      content: (
        <>
          <p>
            A descrição resumida apresenta o seu conjunto de dados numa ou duas frases. Facilita a
            compreensão imediata do conteúdo pelos utilizadores e aumenta a sua visibilidade nos
            resultados de pesquisa.
          </p>
          <p className="mt-3 font-bold">Sugestões automáticas</p>
          <p className="mt-2">
            Uma primeira versão pode ser gerada automaticamente se já tiver preenchido o título e
            uma descrição de pelo menos 200 caracteres, sendo então adaptada de acordo com as suas
            necessidades.
          </p>
          <p className="mt-3">
            <AppLink href="#">
              A IA baseia-se exclusivamente nas informações que forneceu e, por vezes, pode cometer
              erros: releia sempre a proposta antes de validar.
            </AppLink>
          </p>
        </>
      ),
    },
    {
      title: "Adicionar palavras-chave",
      content: (
        <>
          <p>
            As palavras-chave ajudam a caracterizar o conjunto de dados, tornam-no mais fácil de
            encontrar e contribuem para um melhor posicionamento nos motores de busca.
          </p>
          <p className="mt-3 font-bold">Sugestões automáticas</p>
          <p className="mt-2">
            Com base no conteúdo do seu conjunto de dados, podem ser sugeridas palavras-chave
            automaticamente. Pode aceitá-las, modificá-las ou excluí-las.
          </p>
          <p className="mt-3">
            <AppLink href="#">
              A IA baseia-se exclusivamente nas informações que forneceu e, por vezes, pode cometer
              erros: releia sempre a proposta antes de validar.
            </AppLink>
          </p>
        </>
      ),
    },
    {
      title: "Selecionar uma licença",
      content: (
        <p>
          As licenças definem as regras para a reutilização. Ao escolher uma licença de
          reutilização, garante que o conjunto de dados publicado será reutilizado de acordo com os
          termos de uso que definiu.
        </p>
      ),
    },
    {
      title: "Escolher a frequência de atualização",
      content: (
        <p>
          A frequência de atualização refere-se à frequência com que pretende atualizar os dados
          publicados.
        </p>
      ),
      hasError: !!errors.frequency,
    },
    {
      title: "Fornecer a cobertura temporal",
      content: (
        <>
          <p>A abrangência temporal indica o período de tempo dos dados publicados.</p>
          <p>Por exemplo: de 2012 a 2015.</p>
        </>
      ),
    },
    {
      title: "Indicar a granularidade espacial",
      content: (
        <p>
          A granularidade espacial representa o grau de detalhe geográfico presente nos seus dados,
          como, por exemplo, freguesia ou município.
        </p>
      ),
    },
  ];
}
