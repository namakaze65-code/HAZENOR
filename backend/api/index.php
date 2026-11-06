<?php

// Enable full error reporting to diagnose startup issues
ini_set('display_errors', '1');
error_reporting(E_ALL);

// Check if composer vendor directory exists
if (! file_exists(__DIR__ . '/../vendor/autoload.php')) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'error',
        'message' => 'Composer vendor/autoload.php tidak ditemukan pada runtime Vercel.',
        'base_path' => realpath(__DIR__ . '/..'),
    ]);
    exit;
}

// 1. Prepare writable /tmp storage for Vercel Serverless
$storagePath = '/tmp/storage';
$_ENV['LARAVEL_STORAGE_PATH'] = $storagePath;
$_SERVER['LARAVEL_STORAGE_PATH'] = $storagePath;
putenv("LARAVEL_STORAGE_PATH={$storagePath}");
putenv("VIEW_COMPILED_PATH={$storagePath}/framework/views");

foreach ([
    $storagePath,
    $storagePath . '/app',
    $storagePath . '/app/public',
    $storagePath . '/framework',
    $storagePath . '/framework/cache',
    $storagePath . '/framework/cache/data',
    $storagePath . '/framework/sessions',
    $storagePath . '/framework/views',
    $storagePath . '/logs',
] as $dir) {
    if (! is_dir($dir)) {
        @mkdir($dir, 0777, true);
    }
}

// 2. Normalize REQUEST_URI on Vercel so /api routes match Laravel routing
if (! empty($_SERVER['REQUEST_URI']) && ! str_starts_with($_SERVER['REQUEST_URI'], '/api')) {
    $_SERVER['REQUEST_URI'] = '/api' . $_SERVER['REQUEST_URI'];
}

// 3. Exception fallback to surface exact error details
try {
    require __DIR__ . '/../public/index.php';
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ]);
}
