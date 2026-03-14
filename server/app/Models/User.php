<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'password_hash',
    ];

    protected $hidden = [
        'password_hash',
    ];

    public $timestamps = true;

    // Override the getAuthPassword method to use password_hash
    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    // Relationship with inventories
    public function inventories()
    {
        return $this->hasMany(Inventory::class);
    }

    // Relationship with recipes
    public function recipes()
    {
        return $this->hasMany(Recipe::class, 'created_by');
    }

    // Relationship with sessions (assuming from Session model)
    public function sessions()
    {
        return $this->hasMany(Session::class, 'created_by');
    }
}