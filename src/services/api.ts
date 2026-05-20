import { getApiBaseUrl } from "@/service/utils/API";

export { fetchCsrfToken, login, logout, fetchCurrentUser } from "@/api/auth";

export {
  fetchMyDatasets,
  fetchMyOrgDatasets,
  fetchDatasets,
  fetchAdminDatasets,
  fetchLicenses,
  fetchFrequencies,
  fetchSchemas,
  fetchDatasetBadges,
  fetchResourceTypes,
  fetchGranularities,
  fetchSpatialZonesByIds,
  fetchDataset,
  createDataset,
  updateDataset,
  deleteDataset,
  createResource,
  uploadResource,
  updateResource,
  replaceResourceFile,
  deleteResource,
  reorderResources,
  toggleDatasetFeatured,
  fetchAllowedExtensions,
  suggestFormats,
  suggestDatasets,
} from "@/api/datasets";

export {
  fetchMyReuses,
  fetchReuses,
  fetchReuse,
  fetchReuseTypes,
  fetchReuseTopics,
  createReuse,
  updateReuse,
  deleteReuse,
  uploadReuseImage,
  linkDatasetToReuse,
  unlinkDatasetFromReuse,
  linkDataserviceToReuse,
  suggestReuses,
  followReuse,
  unfollowReuse,
} from "@/api/reuses";

export {
  fetchUserProfile,
  updateProfile,
  uploadUserAvatar,
  fetchUsers,
  fetchUser,
  updateUser,
  deleteUser,
  fetchUserRoles,
  fetchUserActivity,
} from "@/api/users";

export {
  uploadAvatar,
  deleteAvatar,
  fetchFullProfile,
  fetchApiTokens,
  generateApiKey,
  revokeApiToken,
  requestEmailChange,
  changePassword,
  deleteAccount,
  fetchMyMetrics,
} from "@/api/profile";

export {
  fetchMigrationPending,
  searchMigrationAccount,
  sendMigrationCode,
  confirmMigration,
  skipMigration,
} from "@/api/migration";

export {
  fetchOrganizations,
  fetchOrganization,
  fetchOrgBadges,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  uploadOrgLogo,
  suggestOrganizations,
  fetchOrgRoles,
  requestMembership,
  fetchMembershipRequests,
  acceptMembership,
  refuseMembership,
  addMember,
  updateMemberRole,
  removeMember,
  fetchOrgContactPoints,
  createContactPoint,
  fetchOrgMetrics,
  fetchOrgInvitations,
  fetchOrgDatasets,
  fetchOrgReuses,
} from "@/api/organizations";

export {
  fetchDataservices,
  fetchMyDataservices,
  fetchOrgDataservices,
  fetchDataservice,
  createDataservice,
  updateDataservice,
  deleteDataservice,
  searchDataservices,
} from "@/api/dataservices";

export {
  searchDatasets,
  searchOrganizations,
  searchReuses,
  suggestTags,
  suggestUsers,
  suggestGlobalSearch,
  suggestSpatialZones,
} from "@/api/search";

export {
  fetchPosts,
  fetchPost,
  createPost,
  updatePost,
  fetchAdminPosts,
  publishPost,
  unpublishPost,
  deletePost,
  uploadPostImage,
} from "@/api/posts";

export {
  fetchNotifications,
  markNotificationRead,
} from "@/api/notifications";

export {
  fetchSiteInfo,
  updateSiteConfig,
  fetchHomepageData,
  fetchFeaturedDatasets,
  fetchFeaturedReuses,
  fetchLatestDatasets,
  fetchLatestReuses,
  fetchHomeFeaturedDatasets,
  updateHomeFeaturedDatasets,
  fetchHomeFeaturedReuses,
  updateHomeFeaturedReuses,
  fetchSystemLogs,
  fetchSystemLogContent,
  submitSupportContact,
  checkUrlReachable,
} from "@/api/system";
export type { SupportTopic } from "@/api/system";

export {
  fetchOrgDiscussions,
  fetchDiscussions,
  fetchTopics,
  createDiscussion,
  fetchTopic,
  replyToDiscussion,
  fetchTopicElements,
  createTopic,
  updateTopic,
  deleteTopic,
  addTopicElement,
  removeTopicElement,
  updateTopicElements,
  closeDiscussion,
  deleteDiscussion,
  updateDiscussion,
  editDiscussionComment,
  deleteDiscussionComment,
} from "@/api/discussions-topics";

export {
  fetchFollowers,
  fetchUserFollowers,
  fetchMyFollowing,
  fetchUserFollowing,
  followEntity,
  unfollowEntity,
  isFollowing,
} from "@/api/followers";

export {
  fetchMyCommunityResources,
  fetchMyOrgCommunityResources,
  fetchAllCommunityResources,
  fetchCommunityResourcesByDataset,
  createCommunityResource,
  fetchCommunityResource,
  updateCommunityResource,
  deleteCommunityResource,
  uploadCommunityResourceFile,
  fetchOrgCommunityResources,
} from "@/api/community-resources";

export {
  fetchHarvesters,
  fetchHarvester,
  createHarvester,
  updateHarvester,
  deleteHarvester,
  scheduleHarvester,
  unscheduleHarvester,
  triggerHarvest,
  fetchHarvestJobs,
  fetchHarvestJob,
  validateHarvestSource,
  rejectHarvestSource,
  previewHarvestSource,
  fetchHarvestBackends,
  fetchOrgHarvesters,
} from "@/api/harvesters";

export {
  fetchReportReasons,
  createReport,
  fetchReports,
  dismissReport,
} from "@/api/reports";

export { fetchSpatialZones, fetchGeoLevels } from "@/api/spatial";
export { fetchActivity } from "@/api/activity";
export { requestTransfer } from "@/api/transfers";

const API_BASE_URL = getApiBaseUrl(1);

type OrgExportType = "datasets" | "dataservices" | "discussions" | "datasets-resources";
type SiteExportType =
  | "datasets"
  | "resources"
  | "organizations"
  | "reuses"
  | "dataservices"
  | "harvests"
  | "tags";

export function getOrgExportUrl(org: string, type: OrgExportType): string {
  return `${API_BASE_URL}/organizations/${org}/${type}.csv`;
}

export function getSiteExportUrl(type: SiteExportType): string {
  return `${API_BASE_URL}/site/${type}.csv`;
}
