import { ChecklistItem, CloseButton, HoverArrowLink } from "./LoginShared";

export function EidasModalContent({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-24 flex flex-col gap-24">
      <CloseButton onClick={onClose} />
      <h2 className="text-xl-bold text-brand-blue-dark">O que precisa para criar uma conta?</h2>
      <ul className="flex flex-col gap-16">
        <ChecklistItem>
          Ter um mecanismo de identificação eletrónica emitida por outro Estado-Membro da União
          Europeia que já tenha infraestruturas de autenticação (eIDAS) disponível.
        </ChecklistItem>
      </ul>
      <div className="mt-32 flex flex-col items-start gap-24">
        <HoverArrowLink href="https://www.autenticacao.gov.pt/eidas">
          Criar conta com Autenticação Europeia
        </HoverArrowLink>
      </div>
    </div>
  );
}
