import type { SpatialZone } from "@/types/api";

export const ZONE_PT_NAMES: Record<string, string> = {
  "country-group:world": "Mundo",
  "country-group:ue": "União Europeia",
  "country:za": "Africa do Sul",
  "country:dz": "Argelia",
  "country:ao": "Angola",
};

export function getZoneName(zone: SpatialZone): string {
  return ZONE_PT_NAMES[zone.id] || zone.name;
}
