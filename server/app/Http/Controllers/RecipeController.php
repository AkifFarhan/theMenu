<?php

namespace App\Http\Controllers;

use App\Models\Recipe;
use Illuminate\Http\Request;

class RecipeController extends Controller
{
    public function index()
    {
        $recipes = Recipe::with('ingredients')->get();
        return response()->json($recipes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'is_ai_generated' => 'boolean',
            'ingredients' => 'required|array',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
        ]);

        $recipe = Recipe::create([
            'title' => $request->title,
            'description' => $request->description,
            'is_ai_generated' => $request->is_ai_generated ?? false,
            'created_by' => 1, // Temporary
        ]);

        foreach ($request->ingredients as $ing) {
            $recipe->ingredients()->attach($ing['id'], ['required_quantity' => $ing['quantity']]);
        }

        return response()->json($recipe->load('ingredients'), 201);
    }

    public function show(Recipe $recipe)
    {
        return response()->json($recipe->load('ingredients'));
    }

    public function update(Request $request, Recipe $recipe)
    {
        $request->validate([
            'title' => 'required|string',
            'description' => 'nullable|string',
            'is_ai_generated' => 'boolean',
            'ingredients' => 'required|array',
            'ingredients.*.id' => 'required|exists:ingredients,id',
            'ingredients.*.quantity' => 'required|numeric|min:0',
        ]);

        $recipe->update($request->all());

        $recipe->ingredients()->detach();
        foreach ($request->ingredients as $ing) {
            $recipe->ingredients()->attach($ing['id'], ['required_quantity' => $ing['quantity']]);
        }

        return response()->json($recipe->load('ingredients'));
    }

    public function destroy(Recipe $recipe)
    {
        $recipe->delete();
        return response()->json(null, 204);
    }
}