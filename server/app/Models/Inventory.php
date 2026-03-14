<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'ingredient_id',
        'quantity',
        'expiry_date',
    ];

    public $timestamps = true;

    // Relationship with user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relationship with ingredient
    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
}