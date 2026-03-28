<?php

namespace App\Http\Controllers;

use App\Models\Ingredient;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class InventoryController extends Controller
{
    /**
     * Get all ingredients from the database
     */
    public function getIngredients()
    {
        try {
            $ingredients = Ingredient::all(['id', 'name', 'base_unit'])->toArray();
            return response()->json([
                'ingredients' => $ingredients
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch ingredients',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user's current inventory
     */
    public function getInventory()
    {
        try {
            $user = Auth::user();
            
            $items = Inventory::where('user_id', $user->id)
                ->with('ingredient:id,name,base_unit')
                ->get()
                ->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->ingredient->name,
                        'quantity' => $item->quantity,
                        'unit' => $item->ingredient->base_unit,
                        'expiry_date' => $item->expiry_date,
                        'ingredient_id' => $item->ingredient_id
                    ];
                });

            return response()->json([
                'items' => $items
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch inventory',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Add multiple inventory items at once
     */
    public function addInventoryItems(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'items' => 'required|array|min:1',
                'items.*.ingredient_id' => 'required|integer|exists:ingredients,id',
                'items.*.quantity' => 'required|numeric|min:0.01',
                'items.*.expiry_date' => 'nullable|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user = Auth::user();
            $items = $request->input('items');
            $addedCount = 0;

            foreach ($items as $item) {
                $ingredientId = $item['ingredient_id'];
                $quantity = $item['quantity'];
                $expiryDate = $item['expiry_date'] ?? null;

                // Check if inventory item already exists
                $existingItem = Inventory::where('user_id', $user->id)
                    ->where('ingredient_id', $ingredientId)
                    ->first();

                if ($existingItem) {
                    // Update quantity (add to existing)
                    $existingItem->quantity += $quantity;
                    if ($expiryDate) {
                        $existingItem->expiry_date = $expiryDate;
                    }
                    $existingItem->save();
                } else {
                    // Create new inventory item
                    Inventory::create([
                        'user_id' => $user->id,
                        'ingredient_id' => $ingredientId,
                        'quantity' => $quantity,
                        'expiry_date' => $expiryDate
                    ]);
                }

                $addedCount++;
            }

            return response()->json([
                'message' => "Successfully added $addedCount item(s) to inventory"
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to add inventory items',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete an inventory item
     */
    public function deleteInventoryItem($id)
    {
        try {
            $user = Auth::user();
            
            $item = Inventory::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (!$item) {
                return response()->json([
                    'message' => 'Inventory item not found'
                ], 404);
            }

            $item->delete();

            return response()->json([
                'message' => 'Inventory item deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an inventory item
     */
    public function updateInventoryItem(Request $request, $id)
    {
        try {
            $user = Auth::user();

            $validator = Validator::make($request->all(), [
                'quantity' => 'sometimes|numeric|min:0.01',
                'expiry_date' => 'sometimes|nullable|date'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $item = Inventory::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (!$item) {
                return response()->json([
                    'message' => 'Inventory item not found'
                ], 404);
            }

            if ($request->has('quantity')) {
                $item->quantity = $request->input('quantity');
            }
            if ($request->has('expiry_date')) {
                $item->expiry_date = $request->input('expiry_date');
            }

            $item->save();

            return response()->json([
                'message' => 'Inventory item updated successfully',
                'item' => $item
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update inventory item',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
