
export interface Product {
  id: number;
  businessId: number;
  businessName: string;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  stockQuantity: number;
  unit: string;
  status: string;
  available: boolean;
}
