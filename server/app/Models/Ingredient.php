<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Ingredient extends Model
{
    protected $table = 'ingredients';

    protected $fillable = [
        'name',
        'base_unit'
    ];

    protected $hidden = [
        'created_at',
        'updated_at'
    ];

    /**
     * Get all inventories that use this ingredient
     */
    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    /**
     * Get all recipes that use this ingredient
     */
    public function recipes()
    {
        return $this->belongsToMany(Recipe::class, 'recipe_ingredients', 'ingredient_id', 'recipe_id')
            ->withPivot('required_quantity');
    }
}
