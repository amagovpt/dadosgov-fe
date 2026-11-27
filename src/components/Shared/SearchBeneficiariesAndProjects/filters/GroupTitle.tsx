import { Typograph } from "../../Generics/Typograph";

export interface IGroupTitle {
  title: string;
}

export default function GroupTitle({ title }: IGroupTitle) {
  return (
    <Typograph tag="h2" className="text-l-bold text-primary-900">
      {title}
    </Typograph>
  );
}
