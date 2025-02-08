<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreProductRequest;
use App\Http\Requests\UpdateProductRequest;
use App\Http\Resources\ProductResource;

use App\Models\Product;

/**
 * Class Product.
 *
 * @author  Krit Bannachaisirisuk
 */
class ProductController extends ApiController
{
    /**
     * @OA\Get(
     *     path="/products",
     *     tags={"products"},
     *     summary="Get all products",
     *     description="This can only be done by the logged in user.",
     *     operationId="getProducts",
     *     @OA\Response(
     *         response="default",
     *         description="successful operation",
     *           @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Product")
     *         ),
     *         @OA\XmlContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/Product")
     *         )
     *     ),
     *      @OA\Parameter(
     *         name="includeDeleted",
     *         in="query",
     *         description="Should include deleted product",
     *         required=false,
     *         explode=true,
     *         @OA\Schema(
     *             default="false",
     *             type="boolean",
     *         )
     *     ),
     * )
     */
    public function index()
    {
        // retrieve all products
        // $includeDeleted = $request->query('includeDeleted', 'false');
        return Product::all();
    }

    /**
     * @OA\Post(
     *     path="/products",
     *     tags={"products"},
     *     summary="create product",
     *     description="This can only be done by the logged in user.",
     *     operationId="createProduct",
     *     @OA\Response(
     *         response="default",
     *         description="successful operation"
     *     ),
     *     @OA\RequestBody(
     *         description="Create product object",
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/Product")
     *     )
     * )
     */
    public function store(StoreProductRequest $request)
    {
        $product = new Product;
        $product->name = $request->name;
        $product->save();
        return $product;
    }

    /**
     * @OA\Get(
     *     path="/products/{productId}",
     *     tags={"products"},
     *     summary="Find product by ID",
     *     description="Returns a single product",
     *     operationId="showProduct",
     *     @OA\Parameter(
     *         name="productId",
     *         in="path",
     *         description="ID of product to return",
     *         required=true,
     *         @OA\Schema(
     *             type="integer",
     *             format="int64"
     *         )
     *     ),
     *     @OA\Response(
     *         response=200,
     *         description="successful operation",
     *         @OA\JsonContent(ref="#/components/schemas/Product"),
     *         @OA\XmlContent(ref="#/components/schemas/Product"),
     *     ),
     *     @OA\Response(
     *         response=400,
     *         description="Invalid ID supplier"
     *     ),
     *     @OA\Response(
     *         response=404,
     *         description="Product not found"
     *     ),
     *     security={
     *         {"api_key": {}}
     *     }
     * )
     *
     * @param int $id
     */
    public function show(string $id)
    {
        return Product::findOrFail($id);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateProductRequest $request, Product $product)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Product $product)
    {
        //
    }
}
