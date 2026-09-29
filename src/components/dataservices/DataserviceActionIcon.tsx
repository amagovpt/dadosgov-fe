import LineStar from "@agora-action-icons/line-star";
import SolidStar from "@agora-action-icons/solid-star";
import LineEdit from "@agora-action-icons/line-edit";
import SolidEdit from "@agora-action-icons/solid-edit";

export function DataserviceActionIcon({ name, filled = false }: { name: "star" | "edit"; filled?: boolean }) {
  const Outline = name === "star" ? LineStar : LineEdit;
  const Solid = name === "star" ? SolidStar : SolidEdit;
  const Default = filled ? Solid : Outline;
  return (
    <span className="icon-wrapper leading shrink-0" aria-hidden="true">
      <Default className="icon icon-m line" aria-hidden="true" focusable="false" />
      <Solid className="icon icon-m solid" aria-hidden="true" focusable="false" />
    </span>
  );
}
