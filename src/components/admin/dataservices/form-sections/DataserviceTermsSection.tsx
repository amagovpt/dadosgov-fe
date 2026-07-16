import { InputText } from "@ama-pt/agora-design-system";

export type DataserviceTermsSectionI = {
  rateLimitingUrl: string;
  availability: string;
  onRateLimitingUrlChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAvailabilityChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function DataserviceTermsSection({
  rateLimitingUrl,
  availability,
  onRateLimitingUrlChange,
  onAvailabilityChange,
}: DataserviceTermsSectionI) {
  return (
    <>
      {" "}
      <h2 className="admin-page__section-title">Termos de uso</h2>
      <div className="admin-page__fields-group">
        <InputText
          label="Link para a documentação sobre limites de chamadas"
          placeholder="Insira o URL aqui"
          id="api-rate-limit-url"
          value={rateLimitingUrl}
          onChange={onRateLimitingUrlChange}
        />
        <InputText
          label="Disponibilidade"
          placeholder="99,9"
          id="api-availability"
          value={availability}
          onChange={onAvailabilityChange}
        />
      </div>
    </>
  );
}
