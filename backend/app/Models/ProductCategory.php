<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class ProductCategory.
 *
 * @author  Krit Bannachaisirisuk
 *
 * @OA\Schema(
 *     title="ProductCategory model",
 *     description="ProductCategory model",
 * )
 */
class ProductCategory extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'product_category';

    /**
     * @OA\Property(
     *     format="int64",
     *     description="ID",
     *     title="ID",
     * )
     *
     * @var int
     */
    private $id;

    /**
     * @OA\Property(
     *     format="int64",
     *     description="Product Category name",
     *     title="Name",
     * )
     *
     * @var string
     */
    private $name;

    /**
     * @OA\Property(
     *     format="int64",
     *     description="Product Category description",
     *     title="Description",
     * )
     *
     * @var string
     */
    private $description;

    /**
     * @OA\Property(
     *     format="int64",
     *     description="Is product category deleted?",
     *     title="Deleted",
     *     default="false"
     * )
     *
     * @var boolean
     */
    private $deleted;
}
