import { StatusCard } from "@ama-pt/agora-design-system";

export default function HarvestersAcceptedStatusInfoCard() {
  return (
    <div className="mb-24">
      <StatusCard
        variant="informative"
        showIcon
        description="O estado 'Validado' refere-se ao processo de aprovacao do harvester e e independente da ultima execucao - a lista pode incluir harvesters com ultima execucao 'Terminado' ou 'Falhado'."
      />
    </div>
  );
}
