export interface DatasetWizardDraftContact {
  id: number;
  name: string;
  email: string;
  link: string;
  saved: boolean;
  errors: Record<string, boolean>;
}
