import { api, APIError } from "encore.dev/api";
import { getDataSource } from "./datasource";
import { Category, Product, Variant } from "./entities";
import { ILike } from "typeorm";
import { requireRole } from "../auth/middleware";

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

export const createCategory = api(
  { expose: true, method: "POST", path: "/catalog/categories", auth: true },
  async (req: CreateCategoryRequest): Promise<CategoryResponse> => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const repo = ds.getRepository(Category);
    const category = repo.create({
      name: req.name,
      sort_order: req.sort_order ?? 0,
    });
    await repo.save(category);
    return {
      id: category.id,
      name: category.name,
      sort_order: category.sort_order,
    };
  }
);

export const listCategories = api(
  { expose: true, method: "GET", path: "/catalog/categories", auth: true },
  async (): Promise<{ categories: CategoryResponse[] }> => {
    const ds = await getDataSource();
    const categories = await ds.getRepository(Category).find({
      order: { sort_order: "ASC" },
    });
    return {
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        sort_order: c.sort_order,
      })),
    };
  }
);

export const updateCategory = api(
  { expose: true, method: "PATCH", path: "/catalog/categories/:id", auth: true },
  async (req: { id: string } & UpdateCategoryRequest): Promise<CategoryResponse> => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const repo = ds.getRepository(Category);
    const category = await repo.findOneBy({ id: req.id });
    if (!category) throw APIError.notFound("Category not found");

    if (req.name !== undefined) category.name = req.name;
    if (req.sort_order !== undefined) category.sort_order = req.sort_order;

    await repo.save(category);
    return {
      id: category.id,
      name: category.name,
      sort_order: category.sort_order,
    };
  }
);

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
  variants?: VariantResponse[];
}

export const createProduct = api(
  { expose: true, method: "POST", path: "/catalog/products", auth: true },
  async (req: CreateProductRequest): Promise<ProductResponse> => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const productRepo = ds.getRepository(Product);

    if (req.category_id) {
      const category = await ds.getRepository(Category).findOneBy({ id: req.category_id });
      if (!category) throw APIError.notFound("Category not found");
    }

    const product = productRepo.create({
      name: req.name,
      description: req.description,
      category_id: req.category_id,
    });
    await productRepo.save(product);
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      archived: product.archived,
    };
  }
);

export const listProducts = api(
  { expose: true, method: "GET", path: "/catalog/products", auth: true },
  async (req: { category_id?: string; search?: string; include_variants?: boolean }): Promise<{ products: ProductResponse[] }> => {
    const ds = await getDataSource();
    const productRepo = ds.getRepository(Product);

    if (req.search || req.include_variants) {
      const qb = productRepo
        .createQueryBuilder("product")
        .leftJoin("product.variants", "variant")
        .where("product.archived = :archived", { archived: false });

      if (req.search) {
        qb.andWhere(
          "(product.name ILIKE :search OR variant.sku ILIKE :search OR variant.barcode ILIKE :search)",
          { search: `%${req.search}%` }
        );
      }

      if (req.category_id) {
        qb.andWhere("product.category_id = :categoryId", { categoryId: req.category_id });
      }

      const products = await qb.orderBy("product.name", "ASC").getMany();

      if (req.include_variants) {
        const variantRepo = ds.getRepository(Variant);
        const productsWithVariants = await Promise.all(
          products.map(async (p) => {
            const variants = await variantRepo.find({
              where: { product_id: p.id },
              order: { sku: "ASC" },
            });
            return {
              id: p.id,
              name: p.name,
              description: p.description,
              category_id: p.category_id,
              archived: p.archived,
              variants: variants.map((v) => ({
                id: v.id,
                product_id: v.product_id,
                sku: v.sku,
                barcode: v.barcode,
                price_cents: v.price_cents,
                cost_cents: v.cost_cents,
                active: v.active,
              })),
            };
          })
        );
        return { products: productsWithVariants };
      }

      return {
        products: products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          category_id: p.category_id,
          archived: p.archived,
        })),
      };
    }

    const where: Record<string, unknown> = { archived: false };
    if (req.category_id) where.category_id = req.category_id;

    const products = await productRepo.find({
      where,
      order: { name: "ASC" },
    });
    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category_id: p.category_id,
        archived: p.archived,
      })),
    };
  }
);

export const updateProduct = api(
  { expose: true, method: "PATCH", path: "/catalog/products/:id", auth: true },
  async (req: { id: string } & UpdateProductRequest): Promise<ProductResponse> => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const productRepo = ds.getRepository(Product);
    const product = await productRepo.findOneBy({ id: req.id });
    if (!product) throw APIError.notFound("Product not found");

    if (req.category_id !== undefined) {
      if (req.category_id !== null) {
        const category = await ds.getRepository(Category).findOneBy({ id: req.category_id });
        if (!category) throw APIError.notFound("Category not found");
      }
      product.category_id = req.category_id;
    }

    if (req.name !== undefined) product.name = req.name;
    if (req.description !== undefined) product.description = req.description;
    if (req.archived !== undefined) product.archived = req.archived;

    await productRepo.save(product);
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      archived: product.archived,
    };
  }
);

export const archiveProduct = api(
  { expose: true, method: "PATCH", path: "/catalog/products/:id/archive", auth: true },
  async (req: { id: string; archive?: boolean }): Promise<ProductResponse> => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const productRepo = ds.getRepository(Product);
    const product = await productRepo.findOneBy({ id: req.id });
    if (!product) throw APIError.notFound("Product not found");

    product.archived = req.archive ?? !product.archived;

    await productRepo.save(product);
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      category_id: product.category_id,
      archived: product.archived,
    };
  }
);

interface CreateVariantRequest {
  sku: string;
  barcode?: string;
  price_cents: number;
  cost_cents?: number;
  active?: boolean;
  low_stock_threshold?: number;
}

interface UpdateVariantRequest {
  sku?: string;
  barcode?: string;
  price_cents?: number;
  cost_cents?: number;
  active?: boolean;
  low_stock_threshold?: number;
}

interface VariantResponse {
  id: string;
  product_id: string;
  sku: string;
  barcode: string | null;
  price_cents: number;
  cost_cents: number;
  active: boolean;
  low_stock_threshold: number;
}

export const createVariant = api(
  { expose: true, method: "POST", path: "/catalog/products/:productId/variants", auth: true },
  async (req: { productId: string } & CreateVariantRequest): Promise<VariantResponse> => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const product = await ds.getRepository(Product).findOneBy({ id: req.productId });
    if (!product) throw APIError.notFound("Product not found");

    const variantRepo = ds.getRepository(Variant);

    const existingSku = await variantRepo.findOneBy({ sku: req.sku });
    if (existingSku) throw APIError.alreadyExists("SKU already exists");

    if (req.barcode) {
      const existingBarcode = await variantRepo.findOneBy({ barcode: req.barcode });
      if (existingBarcode) throw APIError.alreadyExists("Barcode already exists");
    }

    const variant = variantRepo.create({
      product_id: req.productId,
      sku: req.sku,
      barcode: req.barcode,
      price_cents: req.price_cents,
      cost_cents: req.cost_cents ?? 0,
      active: req.active ?? true,
      low_stock_threshold: req.low_stock_threshold ?? 10,
    });
    await variantRepo.save(variant);
    return {
      id: variant.id,
      product_id: variant.product_id,
      sku: variant.sku,
      barcode: variant.barcode,
      price_cents: variant.price_cents,
      cost_cents: variant.cost_cents,
      active: variant.active,
      low_stock_threshold: variant.low_stock_threshold,
    };
  }
);

export const listVariants = api(
  { expose: true, method: "GET", path: "/catalog/products/:productId/variants", auth: true },
  async (req: { productId: string }): Promise<{ variants: VariantResponse[] }> => {
    const ds = await getDataSource();
    const variants = await ds.getRepository(Variant).find({
      where: { product_id: req.productId },
      order: { sku: "ASC" },
    });
    return {
      variants: variants.map((v) => ({
        id: v.id,
        product_id: v.product_id,
        sku: v.sku,
        barcode: v.barcode,
        price_cents: v.price_cents,
        cost_cents: v.cost_cents,
        active: v.active,
        low_stock_threshold: v.low_stock_threshold,
      })),
    };
  }
);

export const getVariant = api(
  { expose: true, method: "GET", path: "/catalog/variants/:id", auth: true },
  async (req: { id: string }): Promise<VariantResponse & { product_name?: string | null }> => {
    const ds = await getDataSource();
    const variantRepo = ds.getRepository(Variant);
    const variant = await variantRepo.findOne({
      where: { id: req.id },
      relations: ["product"],
    });
    if (!variant) throw APIError.notFound("Variant not found");

    return {
      id: variant.id,
      product_id: variant.product_id,
      sku: variant.sku,
      barcode: variant.barcode,
      price_cents: variant.price_cents,
      cost_cents: variant.cost_cents,
      active: variant.active,
      product_name: variant.product?.name || null,
    };
  }
);

export const updateVariant = api(
  { expose: true, method: "PATCH", path: "/catalog/variants/:id", auth: true },
  async (req: { id: string } & UpdateVariantRequest): Promise<VariantResponse> => {
    requireRole("OWNER");
    const ds = await getDataSource();
    const variantRepo = ds.getRepository(Variant);
    const variant = await variantRepo.findOneBy({ id: req.id });
    if (!variant) throw APIError.notFound("Variant not found");

    if (req.sku !== undefined && req.sku !== variant.sku) {
      const existingSku = await variantRepo.findOneBy({ sku: req.sku });
      if (existingSku) throw APIError.alreadyExists("SKU already exists");
      variant.sku = req.sku;
    }

    if (req.barcode !== undefined && req.barcode !== variant.barcode) {
      if (req.barcode !== null) {
        const existingBarcode = await variantRepo.findOneBy({ barcode: req.barcode });
        if (existingBarcode) throw APIError.alreadyExists("Barcode already exists");
      }
      variant.barcode = req.barcode;
    }

    if (req.price_cents !== undefined) variant.price_cents = req.price_cents;
    if (req.cost_cents !== undefined) variant.cost_cents = req.cost_cents;
    if (req.active !== undefined) variant.active = req.active;
    if (req.low_stock_threshold !== undefined) variant.low_stock_threshold = req.low_stock_threshold;

    await variantRepo.save(variant);
    return {
      id: variant.id,
      product_id: variant.product_id,
      sku: variant.sku,
      barcode: variant.barcode,
      price_cents: variant.price_cents,
      cost_cents: variant.cost_cents,
      active: variant.active,
      low_stock_threshold: variant.low_stock_threshold,
    };
  }
);
