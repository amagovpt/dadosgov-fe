import type { ActiveProfile } from "@/context/ActiveProfileContext";
import type { Organization, UserRef } from "@/service/types/identity";

interface ProfileAvatar {
  avatarType: "image" | "initials" | "icon";
  srcPath: string;
}

export interface ProfileDetails extends ProfileAvatar {
  label: string;
  href: string;
}

interface ProfileDetailsOptions {
  user: UserRef | null;
  organizations: Organization[];
  administratorLabel: string;
  organizationFallbackLabel: string;
}

function getAvatar(image: string | null | undefined, icon: string, initials = ""): ProfileAvatar {
  if (image) return { avatarType: "image", srcPath: image };
  if (initials) return { avatarType: "initials", srcPath: initials };
  return { avatarType: "icon", srcPath: icon };
}

export function getProfileDetails(
  profile: ActiveProfile,
  { user, organizations, administratorLabel, organizationFallbackLabel }: ProfileDetailsOptions
): ProfileDetails {
  switch (profile.type) {
    case "personal": {
      const initials = [user?.first_name?.[0], user?.last_name?.[0]].join("").toUpperCase();
      return {
        label: `${user?.first_name ?? ""} ${user?.last_name ?? ""}`.trim(),
        href: "/admin/me/datasets",
        ...getAvatar(user?.avatar_thumbnail, "agora-line-user", initials),
      };
    }
    case "organization": {
      const organization = organizations.find((org) => org.id === profile.orgId);
      return {
        label: organization?.name ?? organizationFallbackLabel,
        href: `/admin/org/${profile.orgId}/datasets`,
        ...getAvatar(organization?.logo_thumbnail, "agora-line-briefcase"),
      };
    }
    case "system":
      return {
        label: administratorLabel,
        href: "/admin/system/datasets",
        avatarType: "icon",
        srcPath: "agora-line-buildings",
      };
  }
}
