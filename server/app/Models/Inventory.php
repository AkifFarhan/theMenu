<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    protected $table = 'inventories';

    protected $fillable = [
        'user_id',
        'ingredient_id',
        'quantity',
        'expiry_date'
    ];

    protected $casts = [
        'quantity' => 'decimal:2',
        'expiry_date' => 'date'
    ];

    /**
     * Get the user that owns this inventory item
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the ingredient for this inventory item
     */
    public function ingredient()
    {
        return $this->belongsTo(Ingredient::class);
    }
}
