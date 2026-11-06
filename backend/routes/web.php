<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'HAZENOR Properties REST API',
        'version' => '1.0.0',
        'environment' => app()->environment(),
        'database' => 'connected',
    ]);
});
