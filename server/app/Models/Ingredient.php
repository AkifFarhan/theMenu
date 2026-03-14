<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'base_unit',
    ];

    public $timestamps = true;

    // Relationship with inventories
    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    // Relationship with recipe_ingredients
    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }
}