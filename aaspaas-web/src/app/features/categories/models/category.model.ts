
export interface Category {
  id: number;
  parentId: number | null;
  name: string;
  slug: string;
  description: string | null;
  type: string;
  status: string;
}
