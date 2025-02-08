<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\View\View;
use OpenApi\Annotations as OA;
use App\Models\User;

/**
 * Class User.
 *
 * @author  Krit Bannachaisirisuk
 */
class UserController extends Controller
{
    
    /**
     * @OA\Get(
     *     path="/user",
     *     tags={"user"},
     *     summary="show user",
     *     description="This can only be done by the logged in user.",
     *     operationId="showUser",
     *     @OA\Response(
     *         response="default",
     *         description="successful operation"
     *     ),
     * )
     */
    public function show(string $id): View
    {
        return view('user.profile', [
            'user' => User::findOrFail($id)
        ]);
    }
}
