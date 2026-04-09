<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Release100UpdateRecipeIngredientsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('recipe_ingredients')) {
            return;
        }

        if (!Schema::hasColumn('recipe_ingredients', 'item_name')) {
            Schema::table('recipe_ingredients', function (Blueprint $table) {
                $table->string('item_name', 150)->nullable()->after('ingredient_id');
            });
        }

        DB::statement(
            "UPDATE recipe_ingredients ri
             INNER JOIN ingredients i ON i.id = ri.ingredient_id
             SET ri.item_name = i.name
             WHERE ri.item_name IS NULL"
        );
        DB::table('recipe_ingredients')->whereNull('item_name')->update(['item_name' => 'unknown']);
        DB::statement("ALTER TABLE recipe_ingredients MODIFY COLUMN item_name VARCHAR(150) NOT NULL");

        if (!Schema::hasColumn('recipe_ingredients', 'amount')) {
            Schema::table('recipe_ingredients', function (Blueprint $table) {
                $table->decimal('amount', 10, 2)->nullable()->after('item_name');
            });
        }
        DB::statement(
            "UPDATE recipe_ingredients
             SET amount = COALESCE(required_quantity, 1.00)
             WHERE amount IS NULL"
        );
        DB::statement("ALTER TABLE recipe_ingredients MODIFY COLUMN amount DECIMAL(10,2) NOT NULL");

        if (!Schema::hasColumn('recipe_ingredients', 'unit')) {
            Schema::table('recipe_ingredients', function (Blueprint $table) {
                $table->string('unit', 30)->nullable()->after('amount');
            });
        }
        DB::table('recipe_ingredients')->whereNull('unit')->update(['unit' => 'piece']);
        DB::statement("ALTER TABLE recipe_ingredients MODIFY COLUMN unit VARCHAR(30) NOT NULL");

        if (!Schema::hasColumn('recipe_ingredients', 'required_quantity')) {
            Schema::table('recipe_ingredients', function (Blueprint $table) {
                $table->decimal('required_quantity', 10, 2)->nullable()->after('unit');
            });
        }
        DB::statement(
            "UPDATE recipe_ingredients
             SET required_quantity = amount
             WHERE required_quantity IS NULL"
        );

        if (Schema::hasColumn('recipe_ingredients', 'ingredient_id')) {
            DB::statement("ALTER TABLE recipe_ingredients MODIFY COLUMN ingredient_id BIGINT UNSIGNED NULL");
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        // Intentionally left empty to avoid destructive rollback on production data.
    }
}
