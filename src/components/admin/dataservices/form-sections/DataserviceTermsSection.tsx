import { InputText } from "@ama-pt/agora-design-system";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation("admin-dataservices");

  return (
    <>
      <h2 className="admin-page__section-title">{t("fields.termsOfUse")}</h2>
      <div className="admin-page__fields-group">
        <InputText
          label={t("fields.rateLimiting")}
          placeholder={t("fields.shortPlaceholder")}
          id="api-rate-limit"
          value={rateLimiting}
          onChange={onRateLimitingChange}
        />
        <InputText
          label={t("fields.rateLimitingUrl")}
          placeholder={t("fields.urlPlaceholder")}
          id="api-rate-limit-url"
          value={rateLimitingUrl}
          onChange={onRateLimitingUrlChange}
        />
      </div>
    </>
  );
}
