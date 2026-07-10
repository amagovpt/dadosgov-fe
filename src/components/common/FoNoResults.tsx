import CardNoResults from "../Primitives/Cards/CardNoResults";
import Icon from "../Primitives/Icon";

export type FoNoResultsI = {
  icon: string;
  title: string;
  subtitle: string;
  description: string;
};

export default function FoNoResults({ icon, title, subtitle, description }: FoNoResultsI) {
  return (
    <CardNoResults
      icon={<Icon name={icon ?? "agora-line-search"} className="h-12 w-12 text-primary-500" />}
      title={title}
      subtitle={<span className="font-bold">{subtitle}</span>}
      description={description}
      position="center"
      hasAnchor={true}
    />
  );
}
