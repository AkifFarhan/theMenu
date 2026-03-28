<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'memberSince' => optional($user->created_at)->format('Y-m'),
        ]);
    }

    public function update(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'memberSince' => ['nullable', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];

        if (! empty($validated['memberSince'])) {
            $user->created_at = Carbon::createFromFormat('Y-m', $validated['memberSince'])->startOfMonth();
        }

        $user->save();

        return response()->json([
            'name' => $user->name,
            'email' => $user->email,
            'memberSince' => optional($user->created_at)->format('Y-m'),
        ]);
    }
}
