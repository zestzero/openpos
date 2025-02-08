<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Product.
 *
 * @author  Krit Bannachaisirisuk
 *
 * @OA\Schema(
 *     title="Product model",
 *     description="Product model",
 * )
 */
class Product extends Model
{
    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'product';

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
     *     description="Product name",
     *     title="Name",
     * )
     *
     * @var string
     */
    private $name;

    /**
     * @OA\Property(
     *     format="int64",
     *     description="Product category",
     *     title="Category",
     * )
     *
     * @var string
     */
    private $category;

    /**
     * @OA\Property(
     *     format="int64",
     *     description="Product quantity",
     *     title="Quantity",
     * )
     *
     * @var int
     */
    private $quantity;


    /**
     * @OA\Property(
     *     format="int64",
     *     description="Is product deleted?",
     *     title="Deleted",
     * )
     *
     * @var boolean
     */
    private $deleted;


    /**
     * @OA\Property(
     *     format="int64",
     *     description="Product price per piece",
     *     title="Price",
     * )
     *
     * @var float
     */
    private $price;
}
