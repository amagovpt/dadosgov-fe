export interface FaqsContent {
  id: string;
  title: string;
  body: string;
  actionTitle: string;
  actions: Array<{
    children: string;
    href: string;
  }>;
}
