export interface MiniCourseStep {
  id: number;
  title: string;
  content: string;
  image?: string;
}

export interface MiniCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  objectives: string[];
  updatedAt: string;
  totalSteps: number;
  steps: MiniCourseStep[];
}

export const miniCoursesData: MiniCourse[] = [
  {
    id: "1",
    slug: "minicurso-sobre-a-introducao-aos-dados-abertos",
    title: "Minicurso sobre a introdução aos dados abertos",
    description:
      "Este mini curso apresenta as informações introdutórias fundamentais dos dados abertos, explicando o que são, para que servem e porque são importantes para a transparência, inovação e reutilização da informação. As imagens utilizadas são apenas ilustrativas e podem ser substituídas ou adaptadas conforme o contexto da apresentação.",
    objectives: [
      "Compreender o que são dados abertos",
      "Conhecer os princípios base dos dados abertos",
      "Identificar as principais características dos dados abertos",
      "Perceber quem pode utilizar dados abertos",
      "Entender os benefícios e usos práticos dos dados abertos",
      "Distinguir dados abertos de outros tipos de dados disponibilizados",
    ],
    updatedAt: "30.09.2026",
    totalSteps: 10,
    steps: [
      {
        id: 1,
        title: "O que são dados abertos?",
        content:
          "São dados disponibilizados de forma livre, que qualquer pessoa pode aceder, utilizar, modificar e partilhar. Devem estar acessíveis sem barreiras técnicas ou legais, permitindo a sua reutilização para fins pessoais, profissionais, científicos ou comerciais.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 2,
        title: "Para que servem os dados abertos?",
        content:
          "Os dados abertos servem para aumentar a transparência das instituições públicas e apoiar a tomada de decisões informadas. Permitem a investigação, a participação cidadã e a criação de novos serviços, aplicações e soluções inovadoras que beneficiam a sociedade.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 3,
        title: "Quem pode usar dados abertos?",
        content:
          "Todos. O formato determina o quão fácil é aceder, reutilizar, analisar e integrar os dados noutros sistemas. Formatos inadequados podem limitar a reutilização, mesmo que os dados estejam publicamente disponíveis.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 4,
        title: "Quais são as principais características dos dados abertos?",
        content:
          "Os dados abertos devem ser facilmente acessíveis e gratuitos, sem discriminação de quem os utiliza. Devem estar completos, atualizados e disponíveis de forma a permitir a reutilização livre, garantindo utilidade, transparência e confiança na informação.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 5,
        title: "Qual a diferença entre dados públicos e dados abertos?",
        content:
          "Dados públicos são informações disponibilizadas por entidades públicas, mas nem sempre podem ser reutilizadas. Os dados abertos, além de públicos, são disponibilizados de forma a permitir o acesso, a reutilização e a partilha livre por qualquer pessoa.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 6,
        title:
          "Os dados abertos devem estar disponíveis para todos em condições iguais?",
        content:
          "Sim. O acesso aos dados abertos deve ser igual para todos, sem discriminação de pessoas, organizações ou finalidades de uso. Este princípio garante transparência, equidade e oportunidades iguais de reutilização da informação.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 7,
        title: "Os dados abertos devem estar atualizados?",
        content:
          "Sim, para serem úteis e confiáveis, os dados abertos precisam refletir a realidade atual, permitindo decisões precisas e soluções eficazes. A atualização regular garante que empresas, cidadãos e pesquisadores possam aproveitar a informação de forma segura e eficiente.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 8,
        title: "Pode haver limites no processo de abertura de dados?",
        content:
          "Sim. Nem todos os dados podem ser abertos, especialmente dados pessoais, sensíveis ou confidenciais. A proteção da privacidade, da segurança e do interesse público deve ser sempre garantida antes da publicação de dados abertos.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 9,
        title: "Os dados abertos podem ser reutilizados e modificados?",
        content:
          "Sim, inclusive para fins comerciais. Podem ser usados, combinados e adaptados por qualquer pessoa, permitindo criar novos serviços, produtos e soluções inovadoras.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 10,
        title: "Como é que os dados abertos beneficiam a economia?",
        content:
          "Os dados abertos estimulam a criação de novos serviços, produtos e empregos, e aumentam a eficiência das empresas. Estudos da UE estimam que o mercado de dados abertos poderá gerar quase 200 mil milhões de euros até 2030. Além disso, promovem inovação, melhoram decisões empresariais e fortalecem a economia digital.",
        image: "/minicourses/placeholder.png",
      },
    ],
  },
  {
    id: "2",
    slug: "minicurso-sobre-reutilizacoes-de-dados-abertos",
    title: "Minicurso sobre reutilizações de dados abertos",
    description:
      "Este minicurso apresenta como reutilizar dados abertos de forma prática e segura. Veremos como transformar informação pública em conhecimento útil, os formatos e licenças mais adequados, e os benefícios de usar dados já disponíveis para projetos, análises e inovação. As imagens utilizadas são apenas ilustrativas e podem ser substituídas ou adaptadas conforme o contexto da apresentação.",
    objectives: [
      "Compreender o conceito de reutilização de dados abertos",
      "Reconhecer a importância de usar dados públicos",
      "Identificar os tipos de dados disponíveis para reutilização",
      "Conhecer os formatos e licenças mais adequados para os dados",
      "Aprender formas práticas de aplicar os dados em projetos ou análises",
      "Perceber os benefícios da reutilização de dados para inovação e decisão",
    ],
    updatedAt: "30.09.2026",
    totalSteps: 10,
    steps: [
      {
        id: 1,
        title: "O que é reutilização de dados?",
        content:
          "Reutilização de dados são formas de usar dados públicos para criar algo novo, como aplicações, gráficos, relatórios ou estudos. Transformando dados abertos em informação útil.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 2,
        title: "Por que é importante reutilizar dados públicos?",
        content:
          "Porque permite criar soluções inovadoras, aumentar a transparência, apoiar decisões baseadas em dados e gerar valor para cidadãos, empresas e investigadores.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 3,
        title: "Que tipos de dados podem ser reutilizados?",
        content:
          "Qualquer dado público disponível no portal, como estatísticas, mapas, dados meteorológicos, dados setoriais como por exemplo de transportes, saúde ou educação.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 4,
        title: "Como se pode reutilizar estes dados na prática?",
        content:
          "Os dados podem ser reutilizados processando-os com software, analisando-os com ferramentas de visualização ou integrando-os em aplicações e serviços digitais. Depois podem ser transformados em informações úteis, como gráficos, mapas ou relatórios, ou usados em apps e sites que ajudam cidadãos e empresas a tomar decisões.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 5,
        title:
          "Quais são os melhores formatos para reutilizar os dados e porquê?",
        content:
          "Os melhores formatos para reutilização são CSV, JSON, XML e usar APIs, porque são estruturados, fáceis de processar e permitem integrar os dados em aplicações, visualizações ou análises. Formatos como PDF ou Excel também podem ser usados, mas exigem mais trabalho para extrair e tratar a informação.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 6,
        title: "Quem pode reutilizar os dados públicos?",
        content:
          "Qualquer pessoa ou entidade: cidadãos, estudantes, investigadores, empresas ou organizações, desde que tenham conta no portal, respeitem as licenças e direitos associados.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 7,
        title: "O que é uma licença de dados abertos?",
        content:
          "Uma licença de dados abertos define as regras sobre como os dados podem ser usados, modificados e partilhados, garantindo que a reutilização é legal e transparente.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 8,
        title: "Quais são as licenças de dados mais comuns no portal?",
        content:
          "No portal, os datasets geralmente têm licenças como CC0 (Creative Commons Zero), que permite qualquer uso sem restrições, CC BY (Atribuição), que exige apenas mencionar a fonte, ou licenças específicas do Governo Português, que podem ter condições adicionais.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 9,
        title: "Como se garante a qualidade dos dados reutilizados?",
        content:
          "Verificando os metadados, a data de atualização e a integridade dos datasets. É também recomendável aplicar boas práticas de tratamento e limpeza de dados antes de os usar em análises ou aplicações, para garantir que a informação final é precisa e útil.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 10,
        title:
          "A reutilização de dados pode ser feita para fins comerciais?",
        content:
          "Sim, desde que a licença associada ao dataset o permita. Muitas licenças de dados abertos autorizam utilização comercial, desde que sejam respeitadas as condições definidas.",
        image: "/minicourses/placeholder.png",
      },
    ],
  },
  {
    id: "3",
    slug: "minicurso-sobre-metadados",
    title: "Minicurso sobre Metadados",
    description:
      "Este mini curso apresenta os conceitos introdutórios fundamentais dos metadados relacionados com dados abertos, explicando o que são, para que servem e porque são essenciais para a descoberta, compreensão e reutilização correta da informação. As imagens utilizadas são apenas ilustrativas e podem ser substituídas ou adaptadas conforme o contexto da apresentação.",
    objectives: [
      "Compreender o que são metadados em dados abertos",
      "Perceber a diferença entre dados e metadados",
      "Entender a importância dos metadados para descoberta de datasets",
      "Reconhecer como os metadados apoiam a reutilização dos dados",
      "Identificar os principais elementos de metadados",
      "Valorizar a qualidade e atualização dos metadados",
    ],
    updatedAt: "30.09.2026",
    totalSteps: 10,
    steps: [
      {
        id: 1,
        title: "O que são metadados?",
        content:
          'Metadados são dados que descrevem outros dados. Fornecem informação sobre o conteúdo, a origem, a data, a estrutura e o contexto de um conjunto de dados. Nos dados abertos, funcionam como uma "ficha descritiva" que ajuda a compreender o dataset.',
        image: "/minicourses/placeholder.png",
      },
      {
        id: 2,
        title: "Para que servem os metadados?",
        content:
          "Servem para explicar, organizar e contextualizar os dados, permitindo que sejam encontrados e compreendidos corretamente. Ajudam os utilizadores a saber o que os dados contêm, de onde vêm e como podem ser usados.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 3,
        title: "Quem utiliza os metadados?",
        content:
          "Os metadados são usados por investigadores, jornalistas, empresas, programadores e cidadãos. Qualquer pessoa que procure ou reutilize dados abertos depende dos metadados para entender rapidamente o conteúdo e a utilidade do dataset.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 4,
        title: "Os metadados ajudam a reutilizar dados abertos? Como?",
        content:
          "Sim. Os metadados explicam o significado, a origem, a estrutura e as datas dos dados, ajudando os utilizadores a interpretá-los corretamente. Isso reduz erros de uso e facilita a adaptação dos dados para novos contextos, análises e aplicações.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 5,
        title: "Qual a diferença entre dados e metadados?",
        content:
          "Os dados são a informação principal (valores, registos, medições). Os metadados são a descrição que explicam esses dados e como devem ser entendidos.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 6,
        title:
          "Os metadados abertos também devem ser claros e atualizados?",
        content:
          "Sim. Metadados claros evitam ambiguidades e ajudam a compreender rapidamente o dataset. Quando estão atualizados, garantem que a descrição corresponde ao conteúdo real, aumentando a confiança e a qualidade da reutilização.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 7,
        title:
          "Os metadados devem ser atualizados quando os dados mudam?",
        content:
          "Sim. Sempre que os dados são alterados, corrigidos ou ampliados, os metadados devem refletir essas mudanças. Caso contrário, os utilizadores podem interpretar mal a informação ou usar dados desatualizados sem saber.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 8,
        title:
          "Quem é responsável por criar os metadados de um dataset aberto?",
        content:
          "Normalmente, a entidade que produz ou publica o dataset é responsável pelos metadados. Cabe-lhe garantir que a descrição é correta, completa e mantida ao longo do tempo, como parte da qualidade dos dados abertos.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 9,
        title: "Os metadados devem seguir padrões ou regras comuns?",
        content:
          "Sim. Usar padrões comuns torna os metadados consistentes e comparáveis entre portais e sistemas. Isso facilita a integração automática, a pesquisa e a troca de dados entre diferentes plataformas.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 10,
        title:
          "Como os metadados ajudam na pesquisa de dados abertos?",
        content:
          "Os metadados incluem títulos, descrições, temas, datas e palavras-chave que permitem pesquisar e filtrar datasets. Funcionam como etiquetas estruturadas que tornam os dados mais fáceis de encontrar nos catálogos de dados abertos.",
        image: "/minicourses/placeholder.png",
      },
    ],
  },
  {
    id: "4",
    slug: "minicurso-sobre-os-diferentes-formatos-de-datasets",
    title: "Minicurso sobre os diferentes formatos de datasets",
    description:
      "Este minicurso apresenta os conceitos essenciais sobre a publicação de dados abertos no dados.gov.pt, com foco nos formatos de datasets, metadados e no modelo das 5 Estrelas dos Dados Abertos. O objetivo é ajudar a compreender como escolher formatos adequados e aplicar boas práticas que facilitem a reutilização dos dados.",
    objectives: [
      "Compreender o que são datasets",
      "Conhecer os principais formatos de datasets",
      "Identificar as principais características dos dados abertos",
      "Entender os benefícios de certos formatos",
      "Perceber e distinguir as diferenças sobre o modelo das 5 Estrelas dos Dados Abertos",
    ],
    updatedAt: "30.09.2026",
    totalSteps: 13,
    steps: [
      {
        id: 1,
        title: "O que é um dataset?",
        content:
          "Um dataset (conjunto de dados) é uma coleção organizada de dados relacionados entre si, normalmente estruturados em tabelas, ficheiros ou serviços, acompanhados por metadados que explicam o seu conteúdo, origem, formato e condições.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 2,
        title: "O que são formatos de dados abertos?",
        content:
          "São os tipos de ficheiros ou estruturas em que os datasets são publicados, de forma a permitir o seu acesso, leitura e reutilização por pessoas e sistemas informáticos. Formatos abertos não dependem de software proprietário e facilitam a interoperabilidade e a reutilização dos dados.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 3,
        title:
          "Porque é importante o formato em que um dataset é publicado?",
        content:
          "O formato determina o quão fácil é aceder, reutilizar, analisar e integrar os dados noutros sistemas. Formatos inadequados podem limitar a reutilização, mesmo que os dados estejam publicamente disponíveis.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 4,
        title: "O que são metadados?",
        content:
          "Metadados são informações que descrevem um dataset, como o título, descrição, entidade publicadora, data de atualização, formato, licença e cobertura temporal ou geográfica. São essenciais para compreender e reutilizar corretamente os dados.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 5,
        title: "O que é um formato legível por máquina?",
        content:
          "É um formato que pode ser automaticamente processado por computadores, sem necessidade de intervenção manual. Exemplos comuns são CSV, JSON, XML e RDF. Estes formatos permitem análise automática, integração com aplicações e reutilização eficiente.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 6,
        title:
          "Quais são os principais formatos usados em dados abertos?",
        content:
          "Os principais formatos de dados abertos são CSV, JSON e XML. O CSV é simples, aberto e muito usado para dados tabulares, sendo um dos formatos mais recomendados. O JSON é um formato leve e estruturado, comum em APIs e aplicações web. O XML é um formato estruturado e extensível, usado na troca de dados entre sistemas, sendo também legível por máquina.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 7,
        title:
          "O que são as 5 Estrelas dos Dados Abertos e porque são importantes?",
        content:
          "As 5 Estrelas dos Dados Abertos são um modelo criado por Tim Berners-Lee que serve para avaliar o nível de abertura e reutilização dos dados publicados na Web. Este modelo ajuda as entidades a publicarem dados de forma progressivamente mais acessível e reutilizável. São importantes porque contribuem para a melhoria na qualidade dos dados, facilitam a sua reutilização e reforçam a transparência e o impacto da informação disponibilizada.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 8,
        title: "O que significa um dataset com 1 estrela?",
        content:
          "Significa que os dados estão disponíveis na Web sob uma licença aberta, independentemente do formato. Podem estar, por exemplo, num PDF ou num ficheiro proprietário.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 9,
        title: "O que significa um dataset com 2 estrelas?",
        content:
          "Significa que os dados estão estruturados, mas ainda em formatos proprietários, como folhas de cálculo fechadas. Já existe organização dos dados, mas a reutilização continua limitada.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 10,
        title: "O que significa um dataset com 3 estrelas?",
        content:
          "Significa que os dados estão estruturados e publicados em formatos não proprietários e legíveis por máquina, como CSV ou JSON, permitindo uma reutilização muito mais eficiente.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 11,
        title: "O que significa um dataset com 4 estrelas?",
        content:
          "Significa que os dados utilizam padrões da Web Semântica, como RDF, e que cada elemento importante tem um identificador único (URI), permitindo ligação direta e interpretação automática.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 12,
        title: "O que significa um dataset com 5 estrelas?",
        content:
          "Significa que os dados estão ligados a outros dados na Web (Linked Open Data), criando contexto adicional e aumentando o seu valor, interoperabilidade e potencial de reutilização.",
        image: "/minicourses/placeholder.png",
      },
      {
        id: 13,
        title: "O que são Linked Open Data?",
        content:
          "São dados abertos publicados de forma a estarem interligados com outros conjuntos de dados através de identificadores e relações explícitas, permitindo uma navegação e análise mais rica da informação.",
        image: "/minicourses/placeholder.png",
      },
    ],
  },
  {
    id: "5",
    slug: "minicurso-sobre-principios",
    title: "Minicurso sobre Princípios",
    description:
      "Este minicurso aborda os princípios fundamentais dos dados abertos, incluindo os princípios internacionais como o Open Data Charter, e como a transparência, participação e inovação são promovidas através da abertura de dados.",
    objectives: [
      "Compreender os princípios internacionais dos dados abertos",
      "Conhecer o Open Data Charter e a sua importância",
      "Entender como a transparência é promovida pelos dados abertos",
      "Reconhecer o papel da participação cidadã nos dados abertos",
      "Identificar como os dados abertos fomentam a inovação",
    ],
    updatedAt: "30.09.2026",
    totalSteps: 8,
    steps: [
      {
        id: 1,
        title: "O que são os princípios dos dados abertos?",
        content:
          "Os princípios dos dados abertos são diretrizes que orientam a publicação e reutilização de dados de forma transparente, acessível e responsável. Servem como referência para governos e organizações que pretendem abrir os seus dados.",
      },
      {
        id: 2,
        title: "O que é o Open Data Charter?",
        content:
          "O Open Data Charter é uma iniciativa internacional que define seis princípios fundamentais para a abertura de dados: abertos por defeito, oportunos e abrangentes, acessíveis e utilizáveis, comparáveis e interoperáveis, para melhorar a governação e o envolvimento cidadão, e para o desenvolvimento inclusivo e inovação.",
      },
      {
        id: 3,
        title: "Por que é importante a transparência nos dados abertos?",
        content:
          "A transparência permite aos cidadãos compreender como as decisões públicas são tomadas, como os recursos são utilizados e como as políticas são implementadas. Os dados abertos são uma ferramenta essencial para garantir esta transparência.",
      },
      {
        id: 4,
        title: "Como os dados abertos promovem a participação cidadã?",
        content:
          "Ao disponibilizar informação pública de forma aberta, os cidadãos podem participar de forma mais informada no debate público, contribuir com soluções e fiscalizar a ação governativa.",
      },
      {
        id: 5,
        title: "Qual o papel da inovação nos dados abertos?",
        content:
          "Os dados abertos são um motor de inovação, permitindo que empresas, investigadores e cidadãos criem novos produtos, serviços e conhecimento a partir de informação pública disponível.",
      },
      {
        id: 6,
        title: "Os dados devem ser abertos por defeito?",
        content:
          "Sim, segundo o princípio 'aberto por defeito', todos os dados públicos devem ser abertos, exceto quando existam razões legítimas para não o fazer, como a proteção de dados pessoais ou a segurança nacional.",
      },
      {
        id: 7,
        title: "Como garantir que os dados são acessíveis e utilizáveis?",
        content:
          "Os dados devem ser publicados em formatos abertos e legíveis por máquina, sem barreiras técnicas ou financeiras ao acesso. Devem também ser acompanhados de documentação clara e metadados completos.",
      },
      {
        id: 8,
        title: "Como aplicar os princípios no contexto nacional?",
        content:
          "Em Portugal, os princípios dos dados abertos são aplicados através do portal dados.gov.pt, alinhado com políticas europeias e nacionais que promovem a abertura, interoperabilidade e reutilização de dados públicos.",
      },
    ],
  },
  {
    id: "6",
    slug: "minicurso-sobre-licencas",
    title: "Minicurso sobre Licenças",
    description:
      "Este minicurso explica os diferentes tipos de licenças aplicáveis aos dados abertos, como escolher a licença adequada e quais são as implicações legais para produtores e reutilizadores de dados.",
    objectives: [
      "Compreender o que são licenças de dados abertos",
      "Conhecer os tipos de licenças mais comuns",
      "Saber como escolher a licença adequada",
      "Entender as implicações legais para produtores",
      "Entender as implicações legais para reutilizadores",
    ],
    updatedAt: "30.09.2026",
    totalSteps: 8,
    steps: [
      {
        id: 1,
        title: "O que é uma licença de dados abertos?",
        content:
          "Uma licença de dados abertos é um instrumento legal que define as condições em que os dados podem ser acedidos, usados, modificados e partilhados. Sem uma licença clara, os dados não podem ser considerados verdadeiramente abertos.",
      },
      {
        id: 2,
        title: "Por que são importantes as licenças?",
        content:
          "As licenças garantem segurança jurídica tanto para quem publica como para quem reutiliza dados. Definem direitos e deveres, evitam ambiguidades e promovem a confiança no ecossistema de dados abertos.",
      },
      {
        id: 3,
        title: "Quais são as licenças Creative Commons mais usadas?",
        content:
          "As mais comuns são a CC0 (domínio público, sem restrições), CC BY (atribuição obrigatória) e CC BY-SA (atribuição e partilha nos mesmos termos). A CC0 e a CC BY são as mais recomendadas para dados abertos.",
      },
      {
        id: 4,
        title: "O que significa a licença CC0?",
        content:
          "A CC0 (Creative Commons Zero) permite qualquer uso sem restrições. O produtor renuncia a todos os direitos, colocando os dados no domínio público. É a licença mais aberta e mais simples de usar.",
      },
      {
        id: 5,
        title: "O que significa a licença CC BY?",
        content:
          "A CC BY (Atribuição) permite qualquer uso dos dados, incluindo comercial, desde que seja mencionada a fonte original. É uma das licenças mais equilibradas entre abertura e reconhecimento do produtor.",
      },
      {
        id: 6,
        title: "Existem licenças específicas do Governo Português?",
        content:
          "Sim, existem licenças específicas definidas pelo Governo Português que podem ter condições adicionais adaptadas ao contexto nacional. Estas devem ser consultadas no portal dados.gov.pt.",
      },
      {
        id: 7,
        title: "Como escolher a licença adequada?",
        content:
          "A escolha da licença depende dos objetivos de abertura: se se pretende máxima reutilização, a CC0 é ideal; se se quer reconhecimento, a CC BY é mais adequada. Deve-se evitar licenças que restrinjam a reutilização sem necessidade.",
      },
      {
        id: 8,
        title: "Quais são as implicações legais de usar dados com licença?",
        content:
          "Os reutilizadores devem respeitar as condições da licença, como mencionar a fonte ou manter a mesma licença em trabalhos derivados. O não cumprimento pode resultar em consequências legais.",
      },
    ],
  },
  {
    id: "7",
    slug: "minicurso-sobre-qualidade",
    title: "Minicurso sobre Qualidade",
    description:
      "Este minicurso aborda as dimensões da qualidade dos dados abertos, os indicadores e métricas utilizados para a avaliar, e como melhorar a qualidade dos dados publicados nos portais de dados abertos.",
    objectives: [
      "Compreender as dimensões da qualidade dos dados",
      "Conhecer os indicadores e métricas de qualidade",
      "Saber como melhorar a qualidade dos dados publicados",
      "Entender a importância da qualidade para a reutilização",
      "Identificar boas práticas de qualidade de dados",
    ],
    updatedAt: "30.09.2026",
    totalSteps: 8,
    steps: [
      {
        id: 1,
        title: "O que é qualidade de dados abertos?",
        content:
          "A qualidade de dados abertos refere-se ao grau em que os dados são adequados para o uso pretendido. Dados de qualidade são precisos, completos, atualizados, consistentes e acessíveis.",
      },
      {
        id: 2,
        title: "Quais são as dimensões da qualidade dos dados?",
        content:
          "As principais dimensões incluem: precisão (os dados estão corretos), completude (não faltam dados), atualidade (os dados são recentes), consistência (não há contradições) e acessibilidade (os dados são fáceis de obter e usar).",
      },
      {
        id: 3,
        title: "Como se mede a qualidade dos dados abertos?",
        content:
          "Através de indicadores e métricas como a taxa de preenchimento de metadados, a frequência de atualização, o formato dos ficheiros, a existência de licenças claras e a conformidade com standards.",
      },
      {
        id: 4,
        title: "Por que é importante a qualidade dos dados?",
        content:
          "Dados de baixa qualidade podem levar a decisões erradas, análises imprecisas e perda de confiança. A qualidade é essencial para que os dados abertos cumpram o seu propósito de informar e apoiar a sociedade.",
      },
      {
        id: 5,
        title: "Como melhorar a qualidade dos dados publicados?",
        content:
          "Através de boas práticas como: validar os dados antes da publicação, preencher metadados completos, usar formatos abertos, garantir atualizações regulares e seguir standards reconhecidos.",
      },
      {
        id: 6,
        title: "O que é a pontuação de qualidade no dados.gov.pt?",
        content:
          "O portal dados.gov.pt atribui uma pontuação de qualidade a cada dataset com base em critérios como a completude dos metadados, o formato dos ficheiros e a frequência de atualização.",
      },
      {
        id: 7,
        title: "Como os metadados influenciam a qualidade?",
        content:
          "Metadados completos e precisos são fundamentais para a qualidade. Permitem que os utilizadores compreendam os dados, avaliem a sua relevância e os reutilizem corretamente.",
      },
      {
        id: 8,
        title: "Quais são as boas práticas de qualidade?",
        content:
          "Incluem: documentar a metodologia de recolha, usar vocabulários controlados, validar automaticamente os dados, estabelecer processos de revisão e manter um contacto ativo com os reutilizadores.",
      },
    ],
  },
  {
    id: "8",
    slug: "minicurso-sobre-como-partilhar-dados-no-dados-gov",
    title: "Minicurso sobre como partilhar dados no dados.gov.pt",
    description:
      "Este minicurso explica como publicar datasets no portal dados.gov.pt, desde a preparação dos dados e metadados de acordo com boas práticas, até à submissão no backoffice e à garantia de atualização contínua.",
    objectives: [
      "Compreender o processo de publicação no dados.gov.pt",
      "Saber preparar dados e metadados de acordo com boas práticas",
      "Conhecer os campos obrigatórios do backoffice",
      "Aprender a submeter um dataset no portal",
      "Entender a importância da atualização contínua",
    ],
    updatedAt: "30.09.2026",
    totalSteps: 8,
    steps: [
      {
        id: 1,
        title: "O que é o portal dados.gov.pt?",
        content:
          "O dados.gov.pt é o portal nacional de dados abertos de Portugal, onde entidades públicas e privadas podem publicar e partilhar datasets para consulta e reutilização pela sociedade.",
      },
      {
        id: 2,
        title: "Quem pode publicar dados no portal?",
        content:
          "Qualquer entidade pública ou organização pode publicar dados no portal, após criar uma conta e associar-se a uma organização. Cidadãos individuais também podem contribuir com recursos comunitários.",
      },
      {
        id: 3,
        title: "Como preparar os dados para publicação?",
        content:
          "Os dados devem ser organizados em formatos abertos (como CSV, JSON ou XML), limpos de erros, acompanhados de metadados completos e publicados com uma licença adequada que permita a reutilização.",
      },
      {
        id: 4,
        title: "Que metadados são necessários?",
        content:
          "Os metadados obrigatórios incluem título, descrição, entidade publicadora, formato, licença, frequência de atualização e cobertura temporal. Quanto mais completos, melhor a descoberta e reutilização.",
      },
      {
        id: 5,
        title: "Como submeter um dataset no backoffice?",
        content:
          "Após iniciar sessão no portal, aceda à área de administração, selecione 'Publicar dados.gov.pt', preencha os campos obrigatórios do formulário, carregue os ficheiros e publique o dataset.",
      },
      {
        id: 6,
        title: "Quais formatos e licenças devo usar?",
        content:
          "Recomenda-se usar formatos abertos como CSV ou JSON e licenças como CC0 ou CC BY. Evite formatos proprietários e licenças restritivas que limitem a reutilização dos dados.",
      },
      {
        id: 7,
        title: "Como garantir a atualização contínua?",
        content:
          "Estabeleça uma frequência de atualização e cumpra-a. Pode usar harvesters para automatizar a recolha ou APIs para manter os dados sempre atualizados no portal.",
      },
      {
        id: 8,
        title: "Boas práticas de publicação",
        content:
          "Inclua documentação, descreva a metodologia, use vocabulários controlados, valide os dados antes de publicar e mantenha contacto com a comunidade de reutilizadores para melhorar continuamente.",
      },
    ],
  },
];

export function getMiniCourseBySlug(slug: string): MiniCourse | undefined {
  return miniCoursesData.find((course) => course.slug === slug);
}
