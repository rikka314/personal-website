<?php

return [
    'app_base_url' => 'https://write.gfm156.com',
    'admin_password_hash' => '',
    'asset_public_base' => '/blog-assets',
    'build_script' => dirname(__DIR__, 2) . '/runtime-builder/scripts/build-blog-runtime.mjs',
    // Leave empty to allow any GitHub account to sign in, or add one or more logins to restrict access.
    'github_allowed_logins' => [],
    'github_client_id' => 'github-oauth-client-id',
    'github_client_secret' => 'github-oauth-client-secret',
    'node_binary' => 'node',
    'public_root' => '/www/wwwdata/blog-runtime',
    'seed_runtime_root' => dirname(__DIR__, 2) . '/seeds/blog-runtime',
    'storage_root' => '/www/wwwdata/blog-source',
];
