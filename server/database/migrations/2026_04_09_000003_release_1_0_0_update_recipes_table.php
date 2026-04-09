<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class Release100UpdateRecipesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('recipes')) {
            return;
        }

        if (!Schema::hasColumn('recipes', 'recipe_type')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->string('recipe_type', 20)->nullable()->after('id');
            });
        }
        DB::table('recipes')->whereNull('recipe_type')->update(['recipe_type' => 'quick']);
        DB::statement("ALTER TABLE recipes MODIFY COLUMN recipe_type VARCHAR(20) NOT NULL");

        if (!Schema::hasColumn('recipes', 'preparation_time')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->string('preparation_time', 50)->nullable()->after('title');
            });
        }
        DB::table('recipes')->whereNull('preparation_time')->update(['preparation_time' => '20 mins']);
        DB::statement("ALTER TABLE recipes MODIFY COLUMN preparation_time VARCHAR(50) NOT NULL");

        if (!Schema::hasColumn('recipes', 'base_servings')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->integer('base_servings')->default(1)->after('preparation_time');
            });
        } else {
            DB::table('recipes')->whereNull('base_servings')->update(['base_servings' => 1]);
            DB::statement("ALTER TABLE recipes MODIFY COLUMN base_servings INT NOT NULL DEFAULT 1");
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
