/**
 * This file was auto-generated by openapi-typescript.
 * Do not make direct changes to the file.
 */

export interface paths {
  '/product-categories': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get all product categories
     * @description This can only be done by the logged in user.
     */
    get: operations['getProductCategories']
    put?: never
    /**
     * create product
     * @description This can only be done by the logged in user.
     */
    post: operations['createProductCategory']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/products': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Get all products
     * @description This can only be done by the logged in user.
     */
    get: operations['getProducts']
    put?: never
    /**
     * create product
     * @description This can only be done by the logged in user.
     */
    post: operations['createProduct']
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/products/{productId}': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * Find product by ID
     * @description Returns a single product
     */
    get: operations['showProduct']
    /**
     * update product
     * @description This can only be done by the logged in user.
     */
    put: operations['updateProduct']
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
  '/user': {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /**
     * show user
     * @description This can only be done by the logged in user.
     */
    get: operations['showUser']
    put?: never
    post?: never
    delete?: never
    options?: never
    head?: never
    patch?: never
    trace?: never
  }
}
export type webhooks = Record<string, never>
export interface components {
  schemas: {
    /**
     * Product model
     * @description Product model
     */
    Product: {
      /**
       * ID
       * Format: int64
       * @description ID
       */
      id?: number
      /**
       * Name
       * Format: int64
       * @description Product name
       */
      name?: string
      /**
       * Category
       * Format: int64
       * @description Product category
       */
      category?: string
      /**
       * Quantity
       * Format: int64
       * @description Product quantity
       */
      quantity?: number
      /**
       * Deleted
       * Format: int64
       * @description Is product deleted?
       * @default false
       */
      deleted: boolean
      /**
       * Price
       * Format: int64
       * @description Product price per piece
       */
      price?: number
    }
    /**
     * ProductCategory model
     * @description ProductCategory model
     */
    ProductCategory: {
      /**
       * ID
       * Format: int64
       * @description ID
       */
      id?: number
      /**
       * Name
       * Format: int64
       * @description Product Category name
       */
      name?: string
      /**
       * Description
       * Format: int64
       * @description Product Category description
       */
      description?: string
      /**
       * Deleted
       * Format: int64
       * @description Is product category deleted?
       * @default false
       */
      deleted: boolean
    }
    /**
     * User model
     * @description User model
     */
    User: unknown
  }
  responses: never
  parameters: never
  requestBodies: never
  headers: never
  pathItems: never
}
export type $defs = Record<string, never>
export interface operations {
  getProductCategories: {
    parameters: {
      query?: {
        /** @description Should include deleted product category */
        includeDeleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description successful operation */
      default: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['ProductCategory'][]
          'application/xml': components['schemas']['ProductCategory'][]
        }
      }
    }
  }
  createProductCategory: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Create product category object */
    requestBody: {
      content: {
        'application/json': components['schemas']['ProductCategory']
      }
    }
    responses: {
      /** @description successful operation */
      default: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
  getProducts: {
    parameters: {
      query?: {
        /** @description Should include deleted product */
        includeDeleted?: boolean
      }
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description successful operation */
      default: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['Product'][]
          'application/xml': components['schemas']['Product'][]
        }
      }
    }
  }
  createProduct: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    /** @description Create product object */
    requestBody: {
      content: {
        'application/json': components['schemas']['Product']
      }
    }
    responses: {
      /** @description successful operation */
      default: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
  showProduct: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description ID of product to return */
        productId: number
      }
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description successful operation */
      200: {
        headers: {
          [name: string]: unknown
        }
        content: {
          'application/json': components['schemas']['Product']
          'application/xml': components['schemas']['Product']
        }
      }
      /** @description Invalid ID supplier */
      400: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
      /** @description Product not found */
      404: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
  updateProduct: {
    parameters: {
      query?: never
      header?: never
      path: {
        /** @description ID of product to return */
        productId: number
      }
      cookie?: never
    }
    /** @description Update product object */
    requestBody: {
      content: {
        'application/json': components['schemas']['Product']
      }
    }
    responses: {
      /** @description successful operation */
      default: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
  showUser: {
    parameters: {
      query?: never
      header?: never
      path?: never
      cookie?: never
    }
    requestBody?: never
    responses: {
      /** @description successful operation */
      default: {
        headers: {
          [name: string]: unknown
        }
        content?: never
      }
    }
  }
}
