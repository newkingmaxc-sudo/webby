<?php

// Vercel serverless environment initialization
$tmpStorage = '/tmp/storage';

$dirs = [
    $tmpStorage,
    $tmpStorage . '/framework',
    $tmpStorage . '/framework/views',
    $tmpStorage . '/framework/cache',
    $tmpStorage . '/framework/cache/data',
    $tmpStorage . '/framework/sessions',
    $tmpStorage . '/logs',
    $tmpStorage . '/app',
    $tmpStorage . '/app/public',
    '/tmp/bootstrap/cache',
];

foreach ($dirs as $dir) {
    if (! is_dir($dir)) {
        @mkdir($dir, 0755, true);
    }
}

// Override storage and compiled views paths in serverless environment
putenv('APP_STORAGE=' . $tmpStorage);
putenv('VIEW_COMPILED_PATH=' . $tmpStorage . '/framework/views');

// Forward request to Laravel front controller
require __DIR__ . '/../public/index.php';
