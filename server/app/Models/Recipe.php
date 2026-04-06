<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Recipe extends Model
{
    protected $table = 'recipes';

    protected $fillable = [
        'recipe_type',
        'title',
        'preparation_time',
        'base_servings',
        'description',
        'is_ai_generated',
        'created_by',
    ];

    protected $casts = [
        'is_ai_generated' => 'boolean',
        'base_servings' => 'integer',
    ];

    public function recipeIngredients()
    {
        return $this->hasMany(RecipeIngredient::class, 'recipe_id');
    }

    public function instructions()
    {
        return $this->hasMany(Instruction::class, 'recipe_id')->orderBy('step_number');
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
