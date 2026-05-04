
import InfoBlockContent from "./InfoBlockContent";
import InfoBlockDescription from "./InfoBlockDescription";
import InfoBlockHeader from "./InfoBlockHeader";
import InfoBlockIFrame from "./InfoBlockIFrame";
import InfoBlockRoot from "./InfoblockRoot";
import InfoBlockTitle from "./InfoBlockTitle";

export interface IInfoBlockProps {
  title?: string,
  titleLevel?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p",
  description?: string[],
  children?: React.ReactNode,
}


export const InfoBlock = {
  Root: InfoBlockRoot,
  Header: InfoBlockHeader,
  Title: InfoBlockTitle,
  Content: InfoBlockContent,
  Description: InfoBlockDescription,
  IFrame: InfoBlockIFrame,
};
