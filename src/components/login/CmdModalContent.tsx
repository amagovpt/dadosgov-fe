import { ChecklistItem, CloseButton, HoverArrowLink } from "./LoginShared";

export function CmdModalContent({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-24 flex flex-col gap-24">
      <CloseButton onClick={onClose} />
      <h2 className="text-xl-bold text-brand-blue-dark">O que precisa para criar uma conta?</h2>
      <ul className="flex flex-col gap-16">
        <ChecklistItem>
          Para cidadãs/ãos nacionais e estrangeiras/os com Chave Móvel Digital (CMD) ativa.
        </ChecklistItem>
        <ChecklistItem>
          Precisa do código PIN da sua CMD e do telemóvel que lhe está associado. Se ainda não o
          fez, pode
          <br />
          <a
            href="https://www.autenticacao.gov.pt/cmd-pedido-chave"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline"
          >
            ativar a Chave Móvel Digital em Autenticação.gov.
          </a>
        </ChecklistItem>
        <ChecklistItem>
          O registo com CMD permite a realização de todos os serviços online disponibilizados neste
          portal.
        </ChecklistItem>
      </ul>
      <div className="mt-32 flex flex-col items-start gap-24">
        <HoverArrowLink href="https://www.autenticacao.gov.pt/cmd-pedido-chave?partnerEntityID=https://dados.gov.pt">
          Criar conta como cidadão nacional
        </HoverArrowLink>
        <HoverArrowLink href="https://www.autenticacao.gov.pt/cmd-pedido-chave-estrangeiro">
          Criar conta como cidadão estrangeiro
        </HoverArrowLink>
      </div>
    </div>
  );
}
