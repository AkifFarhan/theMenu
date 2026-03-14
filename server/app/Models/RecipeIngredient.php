<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RecipeIngredient extends Model
{
    use HasFactory;

    protected $table = 'recipe_ingredients';

    protected $fillable = [
        'recipe_id',
        'ingredient_id',
        'required_quantity',
    ];

    public $timestamps = true;

    // Relationship with recipe
    public function recipe()
    {
        return $this->belongsTo(Recipe::class);
    }

    // Relationship with ingredient
    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
}