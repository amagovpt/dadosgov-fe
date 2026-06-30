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
      title: "Dar um nome à API",
      content:
        'Atribua à API um nome claro, relevante e descritivo, que reflita a sua finalidade ou domínio de aplicação. Um nome adequado facilita a sua identificação e pesquisa no portal. Para garantir consistência na catalogação, inclua sempre o prefixo "API" no nome.',
      hasError: !!errors.name,
    },
    {
      title: "Adicionar uma sigla à API",
      content:
        "Pode incluir uma sigla para identificar a sua API de forma mais rápida e simplificada no portal. As letras da sigla não necessitam de ser separadas por pontos.",
    },
    {
      title: "Escrever uma descrição da API",
      content:
        "Elabore uma descrição clara e precisa da API, de forma a que os utilizadores compreendam a sua finalidade, os dados disponibilizados e o respetivo âmbito (incluindo eventuais limitações ou lacunas). Deve também indicar a frequência de atualização dos dados e os parâmetros disponíveis para realização de pedidos à API no dados.gov.pt.",
      hasError: !!errors.description,
    },
    {
      title: "Definir o link correto da API",
      content:
        "Defina o URL base da API, que corresponde ao ponto de entrada para todas as requisições no portal. Este URL é composto pelo domínio ou endereço do servidor e serve de base para a construção dos diferentes endpoints, através dos quais se acede aos vários recursos disponibilizados pela API.",
    },
    {
      title: "Adicionar um link para a documentação da API",
      content:
        "Sempre que possível, forneça um link para a documentação técnica da API, para permitir que os utilizadores explorem os endpoints, consultem os métodos disponíveis e testem diretamente as chamadas a partir da documentação no dados.gov.pt.",
    },
    {
      title: "Adicionar um link para a documentação técnica",
      content:
        "Inclua um link para a documentação técnica geral da API no dados.gov.pt, onde sejam descritos os passos necessários para a sua integração, utilização e configuração.",
    },
    {
      title: "Especificar o limite de chamadas",
      content:
        "Caso a API tenha limites de utilização, defina claramente o número máximo de chamadas permitidas por minuto, por IP e/ou por token no dados.gov.pt, de forma a garantir uma utilização equilibrada e estável do serviço.",
    },
    {
      title: "Indicar a disponibilidade",
      content:
        "Indique a disponibilidade média da API no portal, expressa em percentagem, refletindo o tempo em que o serviço se encontra operacional e acessível aos utilizadores.",
    },
    {
      title: "Selecionar o tipo de acesso",
      content:
        'Selecione o tipo de acesso à API: aberto, aberto com conta ou restrito. Escolha "aberto" quando os dados forem públicos. Opte por "aberto com conta" quando for necessário realizar a autenticação através de conta para aceder aos dados. No caso de "restrito", indique claramente os tipos de utilizadores autorizados a utilizar a API.',
    },
    {
      title: "Adicionar um link à solicitação de autorização",
      content:
        "Se a API tiver acesso restrito no portal, inclua o link para o formulário de pedido de autorização de acesso.",
    },
    {
      title: "Adicionar um link para a documentação funcional",
      content:
        "A documentação funcional (ou de negócio) da API descreve o seu âmbito e os seus principais casos de utilização, complementando a documentação técnica com informação sobre a forma como os dados podem ser aplicados.",
    },
  ];
}
