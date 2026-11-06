type Header = {
  icon: string;
  title: string;
  description: string;
};

type Item = {
  title: string;
  description: string;
};

export type TechnicalSheetModalData = {
  id: string;
  header: Header;
  dataInfo: Item[];
  body: Item[];
};
