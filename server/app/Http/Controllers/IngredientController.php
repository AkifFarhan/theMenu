<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use Illuminate\Http\Request;

class IngredientController extends Controller
{
    public function index()
    {
        return response()->json(Ingredient::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|unique:ingredients',
            'base_unit' => 'required|string|in:g,ml,piece',
        ]);

        $ingredient = Ingredient::create($request->all());
        return response()->json($ingredient, 201);
    }

    public function show(Ingredient $ingredient)
    {
        return response()->json($ingredient);
    }

    public function update(Request $request, Ingredient $ingredient)
    {
        $request->validate([
            'name' => 'required|string|unique:ingredients,name,' . $ingredient->id,
            'base_unit' => 'required|string|in:g,ml,piece',
        ]);

        $ingredient->update($request->all());
        return response()->json($ingredient);
    }

    public function destroy(Ingredient $ingredient)
    {
        $ingredient->delete();
        return response()->json(null, 204);
    }
}