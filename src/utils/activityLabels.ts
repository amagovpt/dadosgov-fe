const ACTIVITY_KEYS: Record<string, string> = {
  "created a dataset": "createdDataset",
  "updated a dataset": "updatedDataset",
  "deleted a dataset": "deletedDataset",
  "added a resource to a dataset": "addedDatasetResource",
  "updated a resource": "updatedResource",
  "removed a resource from a dataset": "removedDatasetResource",
  "created a dataservice": "createdDataservice",
  "updated a dataservice": "updatedDataservice",
  "deleted a dataservice": "deletedDataservice",
  "created a topic": "createdTopic",
  "updated a topic": "updatedTopic",
  "added an element to a topic": "addedTopicElement",
  "updated an element in a topic": "updatedTopicElement",
  "removed an element from a topic": "removedTopicElement",
  "created an organization": "createdOrganization",
  "updated an organization": "updatedOrganization",
  "followed a user": "followedUser",
  "discussed a dataservice": "discussedDataservice",
  "discussed a dataset": "discussedDataset",
  "discussed a reuse": "discussedReuse",
  "followed a dataservice": "followedDataservice",
  "followed a dataset": "followedDataset",
  "followed a reuse": "followedReuse",
  "followed an organization": "followedOrganization",
  "created a reuse": "createdReuse",
  "updated a reuse": "updatedReuse",
  "deleted a reuse": "deletedReuse",
};

export function translateActivityLabel(label: string, t: (key: string) => string): string {
  const key = ACTIVITY_KEYS[label];
  return key ? t(`admin-common:activity.${key}`) : label;
}
