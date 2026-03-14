<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'is_ai_generated',
        'created_by',
    ];

    public $timestamps = true;

    // Relationship with user
    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // Relationship with recipe_ingredients
    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class);
    }

    // Many-to-many with ingredients through recipe_ingredients
    public function ingredients()
    {
        return $this->belongsToMany(Ingredient::class, 'recipe_ingredients')
                    ->withPivot('required_quantity');
    }
}