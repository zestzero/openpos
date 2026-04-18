import "reflect-metadata";
export declare class Category {
    id: string;
    name: string;
    sort_order: number;
    created_at: Date;
    updated_at: Date;
    products: Product[];
}
export declare class Product {
    id: string;
    name: string;
    description: string | null;
    category_id: string | null;
    category: Category | null;
    archived: boolean;
    created_at: Date;
    updated_at: Date;
    variants: Variant[];
}
export declare class Variant {
    id: string;
    product_id: string;
    product: Product;
    sku: string;
    barcode: string | null;
    price_cents: number;
    cost_cents: number;
    active: boolean;
    created_at: Date;
    updated_at: Date;
}
