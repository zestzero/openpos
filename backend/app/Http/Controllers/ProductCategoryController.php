<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ProductCategory;
use App\Http\Requests\StoreProductCategoryRequest;

class ProductCategoryController extends ApiController
{
    /**
     * @OA\Get(
     *     path="/product-categories",
     *     tags={"product-categories"},
     *     summary="Get all product categories",
     *     description="This can only be done by the logged in user.",
     *     operationId="getProductCategories",
     *     @OA\Response(
     *         response="default",
     *         description="successful operation",
     *           @OA\JsonContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/ProductCategory")
     *         ),
     *         @OA\XmlContent(
     *             type="array",
     *             @OA\Items(ref="#/components/schemas/ProductCategory")
     *         )
     *     ),
     *      @OA\Parameter(
     *         name="includeDeleted",
     *         in="query",
     *         description="Should include deleted product category",
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
        return ProductCategory::all();
    }

    /**
     * @OA\Post(
     *     path="/product-categories",
     *     tags={"product-categories"},
     *     summary="create product",
     *     description="This can only be done by the logged in user.",
     *     operationId="createProductCategory",
     *     @OA\Response(
     *         response="default",
     *         description="successful operation"
     *     ),
     *     @OA\RequestBody(
     *         description="Create product category object",
     *         required=true,
     *         @OA\JsonContent(ref="#/components/schemas/ProductCategory")
     *     )
     * )
     */
    public function store(StoreProductCategoryRequest $request)
    {
        $product = new ProductCategory;
        $product->name = $request->name;
        $product->description = $request->description;
        $product->save();
        return $product;
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
