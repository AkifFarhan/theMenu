<?php

namespace App\Http\Controllers;

use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class InventoryController extends Controller
{
    public function index()
    {
        // For now, return all, but should be per user
        $inventories = Inventory::with('ingredient')->get();
        return response()->json($inventories);
    }

    public function store(Request $request)
    {
        $request->validate([
            'ingredient_id' => 'required|exists:ingredients,id',
            'quantity' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
        ]);

        // Assume user is authenticated, but for now, use first user or something
        // $userId = Auth::id();
        $userId = 1; // Temporary

        $inventory = Inventory::updateOrCreate(
            ['user_id' => $userId, 'ingredient_id' => $request->ingredient_id],
            ['quantity' => $request->quantity, 'expiry_date' => $request->expiry_date]
        );

        return response()->json($inventory->load('ingredient'), 201);
    }

    public function show(Inventory $inventory)
    {
        return response()->json($inventory->load('ingredient'));
    }

    public function update(Request $request, Inventory $inventory)
    {
        $request->validate([
            'quantity' => 'required|numeric|min:0',
            'expiry_date' => 'nullable|date',
        ]);

        $inventory->update($request->all());
        return response()->json($inventory->load('ingredient'));
    }

    public function destroy(Inventory $inventory)
    {
        $inventory->delete();
        return response()->json(null, 204);
    }
}