<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class Release100UpdateCookingLogsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('cooking_logs')) {
            return;
        }

        if (!Schema::hasColumn('cooking_logs', 'people_count')) {
            Schema::table('cooking_logs', function (Blueprint $table) {
                $table->integer('people_count')->default(1)->after('recipe_id');
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
        // Intentionally left empty to avoid destructive rollback on production data.
    }
}
