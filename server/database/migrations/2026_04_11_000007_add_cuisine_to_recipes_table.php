<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddCuisineToRecipesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasColumn('recipes', 'cuisine')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->string('cuisine', 20)->nullable()->after('recipe_type');
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (Schema::hasColumn('recipes', 'cuisine')) {
            Schema::table('recipes', function (Blueprint $table) {
                $table->dropColumn('cuisine');
            });
        }
    }
}
