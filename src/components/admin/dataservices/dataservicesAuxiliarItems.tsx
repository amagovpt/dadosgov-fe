import { AuxiliarItem } from "@/components/admin/AuxiliarList";

interface DataserviceAuxiliarErrors {
  name?: boolean;
  description?: boolean;
}

export function getDataserviceAuxiliarItems(
  errors: DataserviceAuxiliarErrors = {}
): AuxiliarItem[] {
  return [
    {
      title: "Como dar nome à sua API",
      content:
        'Dê à sua API um nome relevante e descritivo que reflita a sua função ou área de aplicação. Um bom nome facilita a pesquisa e a identificação por parte dos utilizadores. Adicione sempre o prefixo "API" para manter a consistência.',
      hasError: !!errors.name,
    },
    {
      title: "Adicione uma abreviatura ou sigla à API",
      content:
        "Tem a opção de adicionar uma sigla à sua API. As letras que compõem essa sigla não precisam de ser separadas por pontos.",
    },
    {
      title: "Escreva uma boa descrição",
      content:
        "Escreva uma descrição clara e precisa da API. Os utilizadores precisam de compreender a finalidade da API, os dados fornecidos, o âmbito abrangido (os dados são completos? Há alguma lacuna?), a frequência de atualização dos dados e os parâmetros que podem ser usados para fazer uma chamada.",
      hasError: !!errors.description,
    },
    {
      title: "Defina o link correto para a API",
      content:
        "A URL base de uma API é o ponto de entrada comum para todos os pedidos, consistindo geralmente num domínio ou endereço de servidor. Serve de base à qual se acrescentam caminhos específicos (endpoints) para aceder aos diversos recursos da API.",
    },
    {
      title: "Adicione um link para a documentação da máquina",
      content:
        "Idealmente, forneça um link OpenAPI (Swagger) que permita aos programadores explorar os endpoints, visualizar os métodos disponíveis e testar consultas diretamente a partir da documentação. Para serviços geográficos, pode fornecer um link para o serviço com um pedido GetCapabilities para obter os metadados do serviço.",
    },
    {
      title: "Adicione um link para a documentação técnica",
      content:
        "Adicione um link para a documentação técnica geral da API, descrevendo os passos de integração.",
    },
    {
      title: "Especifique o limite de chamadas",
      content:
        "Caso o número de chamadas à sua API seja limitado, defina aqui o número máximo de chamadas por minuto, ou mesmo por IP e/ou token.",
    },
    {
      title: "Indique a disponibilidade",
      content:
        "Especifique a disponibilidade média da sua API. O valor deve ser uma percentagem.",
    },
    {
      title: "Selecione um tipo de acesso",
      content:
        'Escolha o tipo de acesso (aberto, aberto com conta ou restrito). Selecione "aberto" se os dados forem públicos. Selecione "aberto com conta" se o acesso aos dados exigir uma conta. Se selecionar "restrito", especifique os tipos de utilizadores que podem aceder a esta API.',
    },
    {
      title: "Adicione um link para o pedido de autorização",
      content:
        "Se a sua API tiver acesso restrito, adicione o link ao formulário de pedido de acesso. É administrador? A solução Datapass permite criar e gerir formulários de pedido de acesso a dados com facilidade.",
    },
    {
      title: "Adicione um link para a documentação comercial",
      content:
        "A documentação comercial da sua API explica o seu âmbito e casos de utilização. Complementa a documentação técnica.",
    },
  ];
}
