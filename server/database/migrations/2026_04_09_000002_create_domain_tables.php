<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateDomainTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        if (!Schema::hasTable('ingredients')) {
            Schema::create('ingredients', function (Blueprint $table) {
                $table->id();
                $table->string('name', 150)->unique();
                $table->string('base_unit', 10);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('recipes')) {
            Schema::create('recipes', function (Blueprint $table) {
                $table->id();
                $table->string('recipe_type', 20);
                $table->string('title', 200);
                $table->string('preparation_time', 50);
                $table->integer('base_servings')->default(1);
                $table->text('description')->nullable();
                $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('inventories')) {
            Schema::create('inventories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('ingredient_id')->constrained('ingredients')->onDelete('cascade');
                $table->decimal('quantity', 10, 2)->default(0);
                $table->date('expiry_date')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'ingredient_id']);
            });
        }

        if (!Schema::hasTable('recipe_ingredients')) {
            Schema::create('recipe_ingredients', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recipe_id')->constrained('recipes')->onDelete('cascade');
                $table->foreignId('ingredient_id')->nullable()->constrained('ingredients')->nullOnDelete();
                $table->string('item_name', 150);
                $table->decimal('amount', 10, 2);
                $table->string('unit', 30);
                $table->decimal('required_quantity', 10, 2)->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('instructions')) {
            Schema::create('instructions', function (Blueprint $table) {
                $table->id();
                $table->foreignId('recipe_id')->constrained('recipes')->onDelete('cascade');
                $table->integer('step_number');
                $table->text('instruction_text');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('cooking_logs')) {
            Schema::create('cooking_logs', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->foreignId('recipe_id')->constrained('recipes')->onDelete('cascade');
                $table->integer('people_count')->default(1);
                $table->decimal('scaling_factor', 5, 2)->default(1.00);
                $table->boolean('auto_deducted')->default(false);
                $table->timestamp('cooked_at')->useCurrent();
                $table->timestamps();
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
        Schema::dropIfExists('cooking_logs');
        Schema::dropIfExists('instructions');
        Schema::dropIfExists('recipe_ingredients');
        Schema::dropIfExists('inventories');
        Schema::dropIfExists('recipes');
        Schema::dropIfExists('ingredients');
    }
}