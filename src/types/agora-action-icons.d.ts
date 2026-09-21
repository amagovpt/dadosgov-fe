// Build aliases point at SVG components supplied by the installed Ágora package.
declare module "@agora-action-icons/*" {
  import type { ComponentType, SVGProps } from "react";
  const Icon: ComponentType<SVGProps<SVGSVGElement>>;
  export default Icon;
}
