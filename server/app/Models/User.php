<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;

class User extends Authenticatable
{
    use Notifiable;

    protected $table = 'users';

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'password_hash',
    ];

    protected $hidden = [
        'password_hash',
        'password',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getAuthPassword()
    {
        return $this->password_hash;
    }

    public function getNameAttribute($value)
    {
        if (! empty($value)) {
            return $value;
        }

        return $this->attributes['username'] ?? null;
    }

    public function setNameAttribute($value)
    {
        $this->attributes['username'] = $value;
    }

    public function setPasswordAttribute($value)
    {
        if (empty($value)) {
            return;
        }

        if (Hash::needsRehash($value)) {
            $this->attributes['password_hash'] = Hash::make($value);
        } else {
            $this->attributes['password_hash'] = $value;
        }
    }
}
