import { DatastoryOverview as DatastoryOverviewType } from "@/types/datastories/datastory";
import OverviewBigNumbers, { OverviewBigNumbersI } from "./Overview/BigNumbers";

export default function DatastoryOverview({ ...data }: DatastoryOverviewType["section"]) {
  console.log("overview data", data);

  switch (data.schemaName) {
    case "section-datastory-bignumbers":
      return <OverviewBigNumbers {...(data as OverviewBigNumbersI)} />;
    case "section-datastory-cards":
      return null;
    case "section-datastory-infographic":
      return null;
    default:
      return null;
  }
}
