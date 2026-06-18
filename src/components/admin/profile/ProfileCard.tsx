/* eslint-disable @next/next/no-img-element */
import { Avatar, Button } from "@ama-pt/agora-design-system";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { UserPublic } from "@/service/types/identity";

interface ProfileCardProps {
  profile: UserPublic | null;
  avatarPreview: string | null;
  onViewPublic: () => void;
}

export function ProfileCard({ profile, avatarPreview, onViewPublic }: ProfileCardProps) {
  const lastModified = profile?.since
    ? format(new Date(profile.since), "d 'de' MMMM 'de' yyyy", { locale: pt })
    : "";

  return (
    <div className="profile-card">
      <div className="profile-card__avatar-container">
        {avatarPreview || profile?.avatar_thumbnail ? (
          <img
            src={avatarPreview ?? profile!.avatar_thumbnail!}
            alt={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`}
            className="profile-card__avatar-img"
          />
        ) : (
          <Avatar
            avatarType={profile?.first_name || profile?.last_name ? "initials" : "icon"}
            srcPath={
              (`${(profile?.first_name || "")[0] || ""}${(profile?.last_name || "")[0] || ""}`.toUpperCase() ||
                "agora-line-user") as unknown as undefined
            }
            alt={`${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`}
            className="profile-card__avatar"
          />
        )}
      </div>

      <div className="profile-card__body">
        <div className="profile-card__info">
          {profile?.organizations?.[0] && (
            <p className="text-base font-light leading-7 text-neutral-900">
              {profile.organizations[0].name}
            </p>
          )}
          <p className="text-xl font-semibold leading-8 text-neutral-900">
            {profile ? `${profile.first_name} ${profile.last_name}` : "..."}
          </p>
          {lastModified && (
            <p className="text-base leading-7 text-neutral-900">
              <span className="font-semibold">Membro desde:</span> {lastModified}
            </p>
          )}
        </div>

        <div className="absolute right-32 top-32">
          <Button
            variant="primary"
            appearance="outline"
            className="bg-white"
            hasIcon
            leadingIcon="agora-line-eye"
            leadingIconHover="agora-solid-eye"
            onClick={onViewPublic}
          >
            Ver perfil público
          </Button>
        </div>
      </div>
    </div>
  );
}
