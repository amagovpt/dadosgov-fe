"use client";

import { useTranslation } from "react-i18next";
import {
  Avatar,
  CardNoResults,
  Icon,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from "@ama-pt/agora-design-system";
import AdminPaginatedTable from "@/components/admin/lists/AdminPaginatedTable";
import TextLink from "@/components/Primitives/TextLink";
import type { Activity } from "@/service/types/catalog";
import { translateActivityLabel } from "@/utils/activityLabels";

interface UserProfileActivityTabProps {
  activities: Activity[];
  isLoading: boolean;
  activityTotal: number;
  activityPage: number;
  activityPageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function UserProfileActivityTab({
  activities,
  isLoading,
  activityTotal,
  activityPage,
  activityPageSize,
  onPageChange,
  onPageSizeChange,
}: UserProfileActivityTabProps) {
  const { t } = useTranslation("admin-profile");

  return (
    <div className="mt-24">
      {isLoading && <p className="text-sm text-neutral-700">{t("activities.loading")}</p>}

      {!isLoading && activities.length === 0 && (
        <CardNoResults
          className="admin-page__empty"
          position="center"
          icon={<Icon name="agora-line-time" className="icon-xl h-12 w-12 text-primary-500" />}
          title={t("activities.emptyTitle")}
          description={t("activities.emptyDescription")}
          hasAnchor={false}
        />
      )}

      {!isLoading && activities.length > 0 && (
        <>
          <h2 className="mb-16 text-base font-medium text-neutral-900">
            {t("activities.count", { count: activityTotal })}
          </h2>
          <AdminPaginatedTable
            pageSize={activityPageSize}
            totalItems={activityTotal}
            currentPage={activityPage}
            setCurrentPage={onPageChange}
            setPageSize={onPageSizeChange}
          >
            <TableHeader>
              <TableRow>
                <TableHeaderCell>{t("activities.user")}</TableHeaderCell>
                <TableHeaderCell>{t("activities.action")}</TableHeaderCell>
                <TableHeaderCell>{t("activities.date")}</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell headerLabel={t("activities.user")}>
                    <div className="flex items-center gap-8">
                      <Avatar
                        avatarType={activity.actor?.avatar_thumbnail ? "image" : "initials"}
                        srcPath={
                          (activity.actor?.avatar_thumbnail ||
                            `${(activity.actor?.first_name || "")[0] || ""}${(activity.actor?.last_name || "")[0] || ""}`.toUpperCase()) as unknown as undefined
                        }
                        alt={`${activity.actor?.first_name || ""} ${activity.actor?.last_name || ""}`}
                      />
                      <TextLink href={`/admin/users/${activity.actor?.id}`} className="text-sm">
                        {activity.actor?.first_name} {activity.actor?.last_name}
                      </TextLink>
                    </div>
                  </TableCell>
                  <TableCell headerLabel={t("activities.action")}>
                    {translateActivityLabel(activity.label, t)}
                  </TableCell>
                  <TableCell headerLabel={t("activities.date")}>
                    {new Date(activity.created_at).toLocaleDateString("pt-PT", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </AdminPaginatedTable>
        </>
      )}
    </div>
  );
}
