import { Button, Icon } from "@ama-pt/agora-design-system";
import { PRIMARY_BUTTON_CLASS } from "./constants";

export function MigrationNotice({
  onSaml,
  onEidas,
}: {
  onSaml: () => void;
  onEidas: () => void;
}) {
  return (
    <>
      <div>
        <h2 className="mb-8 text-xl-bold text-brand-blue-dark">Migração obrigatória</h2>
        <p className="text-neutral-900">
          O login por email e palavra-passe vai ser descontinuado. Para continuar a aceder ao portal,
          é necessário migrar a sua conta para a Chave Móvel Digital (CMD) ou autenticação europeia
          (eIDAS).
        </p>
      </div>
      <div className="bg-amber-50 border-amber-200 rounded-8 border p-24">
        <div className="flex items-start gap-12">
          <Icon
            name="agora-line-info-mark"
            className="text-amber-600 mt-2 h-24 w-24 shrink-0"
          />
          <div>
            <p className="text-sm-bold text-amber-800 mb-4">Como migrar?</p>
            <p className="text-sm text-amber-700">
              Autentique-se com a Chave Móvel Digital (separador &quot;CMD&quot;) ou com a
              autenticação europeia (separador &quot;eIDAS&quot;). O sistema detetará a sua conta
              existente e guiá-lo-á pelo processo de migração. Os seus dados (conjuntos de dados,
              organizações, reutilizações) serão mantidos.
            </p>
          </div>
        </div>
      </div>
      <div className="flex gap-16">
        <Button variant="primary" className={PRIMARY_BUTTON_CLASS} onClick={onSaml}>
          Migrar com CMD
        </Button>
        <Button variant="neutral" className={PRIMARY_BUTTON_CLASS} onClick={onEidas}>
          Migrar com eIDAS
        </Button>
      </div>
    </>
  );
}
