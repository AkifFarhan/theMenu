<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecipeIngredient extends Model
{
    protected $table = 'recipe_ingredients';

    protected $fillable = [
        'recipe_id',
        'ingredient_id',
        'item_name',
        'amount',
        'unit',
        'required_quantity',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'required_quantity' => 'decimal:2',
    ];

    public function recipe()
    {
        return $this->belongsTo(Recipe::class, 'recipe_id');
    }

    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class, 'ingredient_id');
    }
}
