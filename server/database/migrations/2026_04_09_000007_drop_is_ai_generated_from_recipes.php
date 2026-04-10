<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class DropIsAiGeneratedFromRecipes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('recipes') || !Schema::hasColumn('recipes', 'is_ai_generated')) {
            return;
        }

        Schema::table('recipes', function (Blueprint $table) {
            $table->dropColumn('is_ai_generated');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        if (!Schema::hasTable('recipes') || Schema::hasColumn('recipes', 'is_ai_generated')) {
            return;
        }

        Schema::table('recipes', function (Blueprint $table) {
            $table->boolean('is_ai_generated')->default(true);
        });
    }
}
