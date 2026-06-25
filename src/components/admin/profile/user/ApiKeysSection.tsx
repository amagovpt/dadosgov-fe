import { Button, InputText, StatusCard } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { ApiToken } from "@/service/types/identity";

interface ApiKeysSectionProps {
  apiTokens: ApiToken[];
  newToken: string | null;
  newTokenName: string;
  tokenCopied: boolean;
  isGeneratingKey: boolean;
  revokingTokenId: string | null;
  onNameChange: (name: string) => void;
  onGenerate: () => void;
  onCopy: () => void;
  onRevoke: (tokenId: string) => void;
}

export function ApiKeysSection({
  apiTokens,
  newToken,
  newTokenName,
  tokenCopied,
  isGeneratingKey,
  revokingTokenId,
  onNameChange,
  onGenerate,
  onCopy,
  onRevoke,
}: ApiKeysSectionProps) {
  return (
    <div className="flex flex-col gap-16">
      <div>
        <p className="mb-8 text-base font-medium text-neutral-900">Chaves da API</p>
        <p className="text-sm mb-16 text-neutral-700">
          Gere uma chave para autenticar pedidos à API. Por motivos de segurança, a chave completa
          só é apresentada uma vez no momento da criação — guarde-a num local seguro.
        </p>
      </div>

      <div className="flex items-end gap-16">
        <div className="flex-1">
          <InputText
            label="Nome da nova chave (opcional)"
            placeholder="Ex.: Script backup, Integração X..."
            id="new-token-name"
            value={newTokenName}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
          />
        </div>
        <Button
          appearance="outline"
          variant="primary"
          hasIcon
          leadingIcon="agora-line-edit"
          leadingIconHover="agora-solid-edit"
          onClick={onGenerate}
          disabled={isGeneratingKey}
        >
          {isGeneratingKey ? "A gerar..." : "Gerar nova chave"}
        </Button>
      </div>

      {newToken && (
        <StatusCard
          variant="warning"
          showIcon
          description={
            <div className="flex flex-col gap-8">
              <p>
                <strong>Copie esta chave agora.</strong> Não voltará a ser apresentada.
              </p>
              <div className="flex items-center gap-8">
                <code className="text-xs flex-1 break-all rounded-4 border border-neutral-300 bg-neutral-50 px-12 py-8">
                  {newToken}
                </code>
                <Button
                  appearance="outline"
                  variant="primary"
                  hasIcon
                  leadingIcon={tokenCopied ? "agora-line-check" : "agora-line-copy"}
                  leadingIconHover={tokenCopied ? "agora-solid-check" : "agora-solid-copy"}
                  onClick={onCopy}
                >
                  {tokenCopied ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
          }
        />
      )}

      {apiTokens.length > 0 ? (
        <div className="flex flex-col gap-8">
          <p className="text-sm font-medium text-neutral-900">
            Chaves activas ({apiTokens.length})
          </p>
          <div className="flex flex-col divide-y divide-neutral-200 rounded-4 border border-neutral-200">
            {apiTokens.map((token) => (
              <div
                key={token.id}
                className="flex items-center justify-between gap-16 px-16 py-12"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-8">
                    <code className="text-sm font-mono text-neutral-900">
                      {token.token_prefix}…
                    </code>
                    {token.name && (
                      <span className="text-sm text-neutral-700">— {token.name}</span>
                    )}
                  </div>
                  <p className="text-xs mt-4 text-neutral-700">
                    Criada em{" "}
                    {format(new Date(token.created_at), "dd/MM/yyyy", { locale: pt })}
                    {token.last_used_at
                      ? ` · último uso ${formatDistanceToNow(new Date(token.last_used_at), {
                          locale: pt,
                          addSuffix: true,
                        })}`
                      : " · nunca utilizada"}
                  </p>
                </div>
                <Button
                  appearance="outline"
                  variant="danger"
                  hasIcon
                  leadingIcon="agora-line-trash"
                  leadingIconHover="agora-solid-trash"
                  onClick={() => onRevoke(token.id)}
                  disabled={revokingTokenId === token.id}
                >
                  {revokingTokenId === token.id ? "A revogar..." : "Revogar"}
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm italic text-neutral-700">Ainda não tem chaves de API geradas.</p>
      )}
    </div>
  );
}
