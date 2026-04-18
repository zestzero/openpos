interface CreateCategoryRequest {
    name: string;
    sort_order?: number;
}
interface UpdateCategoryRequest {
    name?: string;
    sort_order?: number;
}
interface CategoryResponse {
    id: string;
    name: string;
    sort_order: number;
}
export declare const createCategory: (params: CreateCategoryRequest) => Promise<CategoryResponse>;
export declare const listCategories: () => Promise<{
    categories: CategoryResponse[];
}>;
export declare const updateCategory: (params: {
    id: string;
} & UpdateCategoryRequest) => Promise<CategoryResponse>;
interface CreateProductRequest {
    name: string;
    description?: string;
    category_id?: string;
}
interface UpdateProductRequest {
    name?: string;
    description?: string;
    category_id?: string;
    archived?: boolean;
}
interface ProductResponse {
    id: string;
    name: string;
    description: string | null;
    category_id: string | null;
    archived: boolean;
}
export declare const createProduct: (params: CreateProductRequest) => Promise<ProductResponse>;
export declare const listProducts: (params: {
    category_id?: string;
    search?: string;
}) => Promise<{
    products: ProductResponse[];
}>;
export declare const updateProduct: (params: {
    id: string;
} & UpdateProductRequest) => Promise<ProductResponse>;
interface CreateVariantRequest {
    sku: string;
    barcode?: string;
    price_cents: number;
    cost_cents?: number;
    active?: boolean;
}
interface UpdateVariantRequest {
    sku?: string;
    barcode?: string;
    price_cents?: number;
    cost_cents?: number;
    active?: boolean;
}
interface VariantResponse {
    id: string;
    product_id: string;
    sku: string;
    barcode: string | null;
    price_cents: number;
    cost_cents: number;
    active: boolean;
}
export declare const createVariant: (params: {
    productId: string;
} & CreateVariantRequest) => Promise<VariantResponse>;
export declare const listVariants: (params: {
    productId: string;
}) => Promise<{
    variants: VariantResponse[];
}>;
export declare const updateVariant: (params: {
    id: string;
} & UpdateVariantRequest) => Promise<VariantResponse>;
export {};
