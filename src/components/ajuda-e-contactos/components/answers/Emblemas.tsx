"use client";

export function Emblemas() {
  return (
    <div className="space-y-16">
      <div className="flex flex-col gap-8">
        <p className="font-bold">Emblemas das organizações</p>
        <p>
          Os emblemas permitem identificar determinadas características das organizações registadas
          no portal dados.gov.pt, facilitando a sua identificação pelos utilizadores. Estes emblemas
          são apresentados na página da organização e refletem a sua natureza ou enquadramento
          institucional, como, por exemplo, "Serviço Público", "Associação" ou outras categorias
          aplicáveis.
        </p>
      </div>
      <div className="flex flex-col gap-8">
        <p className="font-bold">Como solicitar a atribuição ou alteração de um emblema?</p>
        <p>
          O gestor da organização pode solicitar a atribuição de um novo emblema ou a alteração de
          um emblema existente através do formulário <b>"Tenho uma pergunta"</b>, disponível nesta
          página.
        </p>
        <p>No pedido, deverá indicar:</p>
        <ul className="list-inside list-disc pl-12">
          <li>O nome da organização;</li>
          <li>O emblema que pretende solicitar ou alterar;</li>
          <li>A respetiva fundamentação, quando aplicável.</li>
        </ul>
        <p>
          Após a receção do pedido, a equipa de gestão do portal analisará a solicitação e
          comunicará o resultado por e-mail.
        </p>
        <p>
          Caso o pedido seja validado, o emblema será atribuído ou atualizado na página da
          organização.
        </p>
      </div>
    </div>
  );
}
