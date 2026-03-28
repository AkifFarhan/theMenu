<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

// Authentication routes (public)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public routes for ingredients (no auth required to get list)
Route::get('/ingredients', [\App\Http\Controllers\InventoryController::class, 'getIngredients']);

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Authentication
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // Inventory Management
    Route::get('/inventory', [\App\Http\Controllers\InventoryController::class, 'getInventory']);
    Route::post('/inventory/bulk', [\App\Http\Controllers\InventoryController::class, 'addInventoryItems']);
    Route::delete('/inventory/{id}', [\App\Http\Controllers\InventoryController::class, 'deleteInventoryItem']);
    Route::put('/inventory/{id}', [\App\Http\Controllers\InventoryController::class, 'updateInventoryItem']);
});