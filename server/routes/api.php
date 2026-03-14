<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\SessionController;
use App\Http\Controllers\IngredientController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\RecipeController;

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

Route::middleware(['auth:sanctum'])->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('/session', [SessionController::class, 'getSession']);
Route::post('/session', [SessionController::class, 'createSession'])->middleware('check.admin');
Route::put('/session', [SessionController::class, 'updateSession'])->middleware('check.admin');
Route::post('/sessions', [SessionController::class, 'viewSessions'])->middleware('check.admin');
Route::post('/attendance', [SessionController::class, 'submitAttendance']);

// New routes for food management
Route::apiResource('ingredients', IngredientController::class);
Route::apiResource('inventories', InventoryController::class);
Route::apiResource('recipes', RecipeController::class);