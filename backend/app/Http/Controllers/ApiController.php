<?php
namespace App\Http\Controllers;

define("API_HOST", env('APP_URL', 'http://localhost').'/api');

/**
 * @OA\Server(url=API_HOST)
 * @OA\Info(title="Backend API", version="0.1")
 */
abstract class ApiController
{
    //
}
