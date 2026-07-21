import { InputText } from "@ama-pt/agora-design-system";

export type DataserviceTermsSectionI = {
  rateLimiting: string;
  rateLimitingUrl: string;
  onRateLimitingChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRateLimitingUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function DataserviceTermsSection({
  rateLimiting,
  rateLimitingUrl,
  onRateLimitingChange,
  onRateLimitingUrlChange,
}: DataserviceTermsSectionI) {
  return (
    <>
      <h2 className="admin-page__section-title">Termos de uso</h2>
      <div className="admin-page__fields-group">
        <InputText
          label="Limite de chamadas"
          placeholder="Insira aqui"
          id="api-rate-limit"
          value={rateLimiting}
          onChange={onRateLimitingChange}
        />
        <InputText
          label="Link para a documentação sobre limites de chamadas"
          placeholder="Insira o URL aqui"
          id="api-rate-limit-url"
          value={rateLimitingUrl}
          onChange={onRateLimitingUrlChange}
        />
      </div>
    </>
  );
}
