<?php

function is_https_request(): bool
{
    return (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || (string)($_SERVER['SERVER_PORT'] ?? '') === '443'
    );
}

session_set_cookie_params([
    'httponly' => true,
    'path' => '/',
    'samesite' => 'Lax',
    'secure' => is_https_request(),
]);

session_start();

function app_root(): string
{
    $repositoryRoot = dirname(__DIR__, 3);
    if (
        file_exists($repositoryRoot . '/package.json')
        && file_exists($repositoryRoot . '/scripts/build-blog-runtime.mjs')
    ) {
        return $repositoryRoot;
    }

    return dirname(__DIR__);
}

function request_base_url(): string
{
    $scheme = is_https_request() ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? '127.0.0.1:8000';

    return $scheme . '://' . $host;
}

function default_build_script(string $root): string
{
    $runtimeBuilderScript = $root . '/runtime-builder/scripts/build-blog-runtime.mjs';
    if (file_exists($runtimeBuilderScript)) {
        return $runtimeBuilderScript;
    }

    return $root . '/scripts/build-blog-runtime.mjs';
}

function default_seed_runtime_root(string $root): string
{
    $deployedSeedRoot = $root . '/seeds/blog-runtime';
    if (is_dir($deployedSeedRoot)) {
        return $deployedSeedRoot;
    }

    return $root . '/server/seeds/blog-runtime';
}

function default_public_root(string $seedRuntimeRoot): string
{
    if (is_dir('/www/wwwdata') || is_dir(dirname('/www/wwwdata/blog-runtime'))) {
        return '/www/wwwdata/blog-runtime';
    }

    return $seedRuntimeRoot;
}

function default_storage_root(string $root): string
{
    if (is_dir('/www/wwwdata') || is_dir(dirname('/www/wwwdata/blog-source'))) {
        return '/www/wwwdata/blog-source';
    }

    return $root . '/storage/blog-source';
}

function detect_node_binary(): string
{
    foreach (['/usr/bin/node', '/usr/local/bin/node'] as $candidate) {
        if (is_executable($candidate)) {
            return $candidate;
        }
    }

    return 'node';
}

function load_app_config(): array
{
    $root = app_root();
    $seedRuntimeRoot = default_seed_runtime_root($root);
    $defaults = [
        'app_base_url' => request_base_url(),
        'admin_password_hash' => '',
        'asset_public_base' => '/blog-assets',
        'build_script' => default_build_script($root),
        'github_allowed_login' => '',
        'github_allowed_logins' => [],
        'github_client_id' => '',
        'github_client_secret' => '',
        'node_binary' => detect_node_binary(),
        'public_root' => default_public_root($seedRuntimeRoot),
        'seed_runtime_root' => $seedRuntimeRoot,
        'storage_root' => default_storage_root($root),
    ];

    $configFile = __DIR__ . '/config.php';
    if (!file_exists($configFile)) {
        return $defaults;
    }

    $custom = require $configFile;
    return array_merge($defaults, is_array($custom) ? $custom : []);
}

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function fail(string $message, int $statusCode = 400): void
{
    throw new RuntimeException($message, $statusCode);
}

function read_json_body(): array
{
    $body = file_get_contents('php://input');
    if (!$body) {
        return [];
    }

    $decoded = json_decode($body, true);
    if (!is_array($decoded)) {
        fail('Invalid JSON request body.', 422);
    }

    return $decoded;
}

function request_path(): string
{
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
    return preg_replace('#^/(?:write/)?api#', '', $path) ?: '/';
}

function article_storage_dir(array $config): string
{
    return rtrim($config['storage_root'], '/\\') . '/articles';
}

function storage_initialized_file(array $config): string
{
    return rtrim($config['storage_root'], '/\\') . '/.initialized';
}

function asset_storage_dir(array $config): string
{
    return rtrim($config['storage_root'], '/\\') . '/assets';
}

function columns_storage_file(array $config): string
{
    return rtrim($config['storage_root'], '/\\') . '/columns.json';
}

function ensure_directory(string $path): void
{
    if (!is_dir($path) && !mkdir($path, 0775, true) && !is_dir($path)) {
        fail("Unable to create directory: {$path}", 500);
    }
}

function storage_article_path(array $config, string $id): string
{
    return article_storage_dir($config) . '/' . $id . '.json';
}

function read_json_file(string $filePath): array
{
    $contents = file_get_contents($filePath);
    if ($contents === false) {
        fail("Unable to read file: {$filePath}", 500);
    }

    $decoded = json_decode($contents, true);
    if (!is_array($decoded)) {
        fail("Invalid JSON in {$filePath}", 500);
    }

    return $decoded;
}

function write_json_file(string $filePath, array $payload): void
{
    ensure_directory(dirname($filePath));
    $result = file_put_contents(
        $filePath,
        json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . PHP_EOL
    );

    if ($result === false) {
        fail("Unable to write file: {$filePath}", 500);
    }
}

function list_seed_articles(array $config): array
{
    $seedDirectory = rtrim($config['seed_runtime_root'], '/\\') . '/articles';
    if (!is_dir($seedDirectory)) {
        return [];
    }

    $articles = [];
    foreach (glob($seedDirectory . '/*.json') ?: [] as $filePath) {
        $articles[] = read_json_file($filePath);
    }

    return $articles;
}

function seed_columns_from_runtime(array $config): array
{
    $indexFile = rtrim($config['seed_runtime_root'], '/\\') . '/index.json';
    if (!file_exists($indexFile)) {
        return [];
    }

    $index = read_json_file($indexFile);
    $columns = [];
    foreach (($index['taxonomies']['columns'] ?? []) as $column) {
        $columns[] = [
            'slug' => $column['slug'],
            'name' => $column['name'] ?? [
                'en' => $column['slug'],
                'zh' => $column['slug'],
            ],
            'description' => $column['description'] ?? [
                'en' => '',
                'zh' => '',
            ],
        ];
    }

    return $columns;
}

function bootstrap_storage(array $config): void
{
    ensure_directory(rtrim($config['storage_root'], '/\\'));
    ensure_directory(article_storage_dir($config));
    ensure_directory(asset_storage_dir($config));

    $markerFile = storage_initialized_file($config);
    $existingArticles = glob(article_storage_dir($config) . '/*.json') ?: [];
    $columnsFileExists = file_exists(columns_storage_file($config));

    if (file_exists($markerFile)) {
        return;
    }

    if ($columnsFileExists || $existingArticles) {
        file_put_contents($markerFile, gmdate('c') . PHP_EOL);
        return;
    }

    $seedColumns = seed_columns_from_runtime($config);
    if ($seedColumns) {
        write_json_file(columns_storage_file($config), $seedColumns);
    }

    foreach (list_seed_articles($config) as $article) {
        $sourceArticle = [
            'id' => $article['id'],
            'slug' => $article['slug'],
            'title' => $article['title'],
            'excerpt' => $article['excerpt'] ?? '',
            'contentMarkdown' => $article['contentMarkdown'] ?? '',
            'language' => $article['language'] ?? 'en',
            'type' => $article['type'] ?? 'note',
            'column' => $article['column'] ?? '',
            'tags' => $article['tags'] ?? [],
            'status' => 'published',
            'coverImage' => $article['coverImage'] ?? null,
            'pinned' => (bool)($article['pinned'] ?? false),
            'pinOrder' => (int)($article['pinOrder'] ?? 999),
            'publishedAt' => $article['publishedAt'] ?? gmdate('c'),
            'createdAt' => $article['createdAt'] ?? ($article['publishedAt'] ?? gmdate('c')),
            'updatedAt' => $article['updatedAt'] ?? ($article['publishedAt'] ?? gmdate('c')),
            'seoTitle' => $article['seoTitle'] ?? $article['title'],
            'seoDescription' => $article['seoDescription'] ?? ($article['excerpt'] ?? ''),
            'enableComments' => $article['enableComments'] ?? true,
        ];

        write_json_file(storage_article_path($config, $sourceArticle['id']), $sourceArticle);
    }

    file_put_contents($markerFile, gmdate('c') . PHP_EOL);
}

function load_columns(array $config): array
{
    $filePath = columns_storage_file($config);
    if (!file_exists($filePath)) {
        return [];
    }

    return read_json_file($filePath);
}

function save_columns(array $config, array $columns): void
{
    write_json_file(columns_storage_file($config), array_values($columns));
}

function slugify_text(string $value, string $fallback = 'item'): string
{
    $value = trim(mb_strtolower($value));
    $value = preg_replace('/[^\p{L}\p{N}\s-]+/u', ' ', $value) ?? '';
    $value = preg_replace('/\s+/u', '-', trim($value)) ?? '';
    $value = preg_replace('/-+/u', '-', $value) ?? '';
    $value = trim($value, '-');

    return $value !== '' ? $value : $fallback;
}

function normalize_iso_date(?string $value): string
{
    if (!$value) {
        return '';
    }

    $timestamp = strtotime($value);
    return $timestamp ? gmdate('c', $timestamp) : '';
}

function generate_article_id(): string
{
    return bin2hex(random_bytes(8));
}

function list_articles(array $config): array
{
    $articles = [];
    foreach (glob(article_storage_dir($config) . '/*.json') ?: [] as $filePath) {
        $articles[] = read_json_file($filePath);
    }

    usort($articles, static function (array $left, array $right): int {
        return strcmp($right['updatedAt'] ?? '', $left['updatedAt'] ?? '');
    });

    return $articles;
}

function find_article(array $config, string $id): ?array
{
    $filePath = storage_article_path($config, $id);
    return file_exists($filePath) ? read_json_file($filePath) : null;
}

function assert_unique_slug(array $config, string $slug, string $excludeId = ''): void
{
    foreach (list_articles($config) as $article) {
        if (($article['slug'] ?? '') === $slug && ($article['id'] ?? '') !== $excludeId) {
            fail('Another article already uses this slug.', 409);
        }
    }
}

function normalize_article_payload(array $payload, array $existing = []): array
{
    $now = gmdate('c');
    $title = trim((string)($payload['title'] ?? $existing['title'] ?? 'Untitled article'));
    $slug = slugify_text((string)($payload['slug'] ?? $existing['slug'] ?? $title), 'untitled-article');
    $tags = $payload['tags'] ?? $existing['tags'] ?? [];
    if (!is_array($tags)) {
        $tags = array_filter(array_map('trim', explode(',', (string)$tags)));
    }

    return [
        'id' => $existing['id'] ?? ($payload['id'] ?? generate_article_id()),
        'slug' => $slug,
        'title' => $title,
        'excerpt' => trim((string)($payload['excerpt'] ?? $existing['excerpt'] ?? '')),
        'contentMarkdown' => (string)($payload['contentMarkdown'] ?? $existing['contentMarkdown'] ?? ''),
        'language' => ($payload['language'] ?? $existing['language'] ?? 'en') === 'zh' ? 'zh' : 'en',
        'type' => (string)($payload['type'] ?? $existing['type'] ?? 'note'),
        'column' => trim((string)($payload['column'] ?? $existing['column'] ?? '')),
        'tags' => array_values(array_filter(array_map('trim', $tags))),
        'status' => ($payload['status'] ?? $existing['status'] ?? 'draft') === 'published' ? 'published' : 'draft',
        'coverImage' => $payload['coverImage'] ?? ($existing['coverImage'] ?? null),
        'pinned' => (bool)($payload['pinned'] ?? $existing['pinned'] ?? false),
        'pinOrder' => (int)($payload['pinOrder'] ?? $existing['pinOrder'] ?? 999),
        'publishedAt' => normalize_iso_date((string)($payload['publishedAt'] ?? $existing['publishedAt'] ?? '')),
        'createdAt' => $existing['createdAt'] ?? $now,
        'updatedAt' => $now,
        'seoTitle' => trim((string)($payload['seoTitle'] ?? $existing['seoTitle'] ?? $title)),
        'seoDescription' => trim((string)($payload['seoDescription'] ?? $existing['seoDescription'] ?? '')),
        'enableComments' => (bool)($payload['enableComments'] ?? $existing['enableComments'] ?? true),
    ];
}

function save_article(array $config, array $article): array
{
    assert_unique_slug($config, $article['slug'], $article['id']);

    if ($article['status'] === 'published' && !$article['publishedAt']) {
        $article['publishedAt'] = gmdate('c');
    }

    write_json_file(storage_article_path($config, $article['id']), $article);
    return $article;
}

function delete_article(array $config, string $id): void
{
    $filePath = storage_article_path($config, $id);
    if (file_exists($filePath) && !unlink($filePath)) {
        fail('Unable to delete article file.', 500);
    }

    $assetDirectory = asset_storage_dir($config) . '/' . $id;
    if (is_dir($assetDirectory)) {
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($assetDirectory, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($iterator as $item) {
            $path = $item->getPathname();
            $result = $item->isDir() ? rmdir($path) : unlink($path);
            if (!$result) {
                fail('Unable to delete article assets.', 500);
            }
        }

        if (!rmdir($assetDirectory)) {
            fail('Unable to delete article assets.', 500);
        }
    }
}

function normalize_uploaded_files(array $payload, string $field): array
{
    if (!isset($payload[$field])) {
        return [];
    }

    $file = $payload[$field];
    if (!is_array($file['name'])) {
        return [$file];
    }

    $normalized = [];
    foreach ($file['name'] as $index => $name) {
        $normalized[] = [
            'name' => $name,
            'type' => $file['type'][$index],
            'tmp_name' => $file['tmp_name'][$index],
            'error' => $file['error'][$index],
            'size' => $file['size'][$index],
        ];
    }

    return $normalized;
}

function store_uploaded_asset(array $config, string $articleId, array $file): array
{
    if (($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
        fail('Asset upload failed.', 422);
    }

    $originalName = (string)($file['name'] ?? 'asset');
    $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $baseName = slugify_text(pathinfo($originalName, PATHINFO_FILENAME), 'asset');
    $storedName = $baseName . '-' . bin2hex(random_bytes(4)) . ($extension ? '.' . $extension : '');

    $targetDirectory = asset_storage_dir($config) . '/' . $articleId;
    ensure_directory($targetDirectory);
    $targetFile = $targetDirectory . '/' . $storedName;

    if (!move_uploaded_file($file['tmp_name'], $targetFile)) {
        fail('Unable to move uploaded asset.', 500);
    }

    return [
        'name' => $originalName,
        'url' => rtrim($config['asset_public_base'], '/\\') . '/' . $articleId . '/' . $storedName,
    ];
}

function parse_scalar_value(string $value)
{
    $trimmed = trim($value, " \t\n\r\0\x0B\"'");
    $lower = strtolower($trimmed);

    if ($lower === 'true') {
        return true;
    }

    if ($lower === 'false') {
        return false;
    }

    if (is_numeric($trimmed)) {
        return strpos($trimmed, '.') !== false ? (float)$trimmed : (int)$trimmed;
    }

    return $trimmed;
}

function parse_front_matter(string $markdown): array
{
    if (!preg_match('/^---\R(.*?)\R---\R?/s', $markdown, $matches)) {
        return [[], $markdown];
    }

    $metadata = [];
    $activeList = null;
    foreach (preg_split('/\R/', $matches[1]) ?: [] as $line) {
        if (preg_match('/^([A-Za-z0-9_]+):\s*(.*)$/', $line, $match)) {
            $key = $match[1];
            $value = trim($match[2]);

            if ($value === '') {
                $metadata[$key] = [];
                $activeList = $key;
            } else {
                $metadata[$key] = parse_scalar_value($value);
                $activeList = null;
            }
            continue;
        }

        if ($activeList && preg_match('/^\s*-\s*(.+)$/', $line, $listMatch)) {
            $metadata[$activeList][] = parse_scalar_value($listMatch[1]);
        }
    }

    return [$metadata, substr($markdown, strlen($matches[0]))];
}

function rewrite_markdown_asset_paths(string $markdown, array $assetMap): string
{
    if (!$assetMap) {
        return $markdown;
    }

    return preg_replace_callback('/\(([^)]+)\)/', static function (array $matches) use ($assetMap): string {
        $rawTarget = trim($matches[1]);
        $targetWithoutTitle = preg_replace('/\s+".*"$/', '', $rawTarget) ?? $rawTarget;
        $baseName = basename($targetWithoutTitle);
        if (isset($assetMap[$baseName])) {
            return '(' . $assetMap[$baseName] . ')';
        }

        return $matches[0];
    }, $markdown) ?? $markdown;
}

function rebuild_public_runtime(array $config): void
{
    if (!file_exists($config['build_script'])) {
        fail('Blog runtime build script was not found.', 500);
    }

    $command = escapeshellcmd($config['node_binary']) . ' ' . escapeshellarg($config['build_script']);
    $descriptors = [
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    $environment = array_merge($_ENV, [
        'BLOG_ALLOW_SEED_FALLBACK' => 'false',
        'BLOG_PUBLIC_ROOT' => $config['public_root'],
        'BLOG_SOURCE_ROOT' => $config['storage_root'],
    ]);

    $process = proc_open($command, $descriptors, $pipes, app_root(), $environment);
    if (!is_resource($process)) {
        fail('Unable to start the runtime build process.', 500);
    }

    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);

    $statusCode = proc_close($process);
    if ($statusCode !== 0) {
        fail(trim($stderr ?: $stdout ?: 'Runtime rebuild failed.'), 500);
    }
}

function http_json(string $url, array $options = []): array
{
    $headers = $options['headers'] ?? [];
    $method = $options['method'] ?? 'GET';
    $content = $options['body'] ?? '';

    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curl, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($curl, CURLOPT_HTTPHEADER, $headers);
        if ($content !== '') {
            curl_setopt($curl, CURLOPT_POSTFIELDS, $content);
        }
        $response = curl_exec($curl);
        $error = curl_error($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($response === false || $status >= 400) {
            fail($error ?: 'Remote request failed.', 502);
        }

        $decoded = json_decode($response, true);
        return is_array($decoded) ? $decoded : [];
    }

    $context = stream_context_create([
        'http' => [
            'method' => $method,
            'header' => implode("\r\n", $headers),
            'content' => $content,
            'ignore_errors' => true,
        ],
    ]);

    $response = file_get_contents($url, false, $context);
    if ($response === false) {
        fail('Remote request failed.', 502);
    }

    $decoded = json_decode($response, true);
    return is_array($decoded) ? $decoded : [];
}

function oauth_is_configured(array $config): bool
{
    return (
        (bool)$config['github_client_id']
        && (bool)$config['github_client_secret']
    );
}

function github_allowed_logins(array $config): array
{
    $allowedLogins = [];
    $rawAllowedLogins = $config['github_allowed_logins'] ?? [];

    if (is_string($rawAllowedLogins)) {
        $rawAllowedLogins = preg_split('/[\s,]+/', $rawAllowedLogins) ?: [];
    }

    if (!is_array($rawAllowedLogins)) {
        $rawAllowedLogins = [];
    }

    foreach ($rawAllowedLogins as $login) {
        $normalizedLogin = strtolower(trim((string)$login));
        if ($normalizedLogin !== '') {
            $allowedLogins[] = $normalizedLogin;
        }
    }

    $legacyAllowedLogins = $config['github_allowed_login'] ?? '';

    if (is_string($legacyAllowedLogins)) {
        $legacyAllowedLogins = preg_split('/[\s,]+/', $legacyAllowedLogins) ?: [];
    } elseif (!is_array($legacyAllowedLogins)) {
        $legacyAllowedLogins = [];
    }

    foreach ($legacyAllowedLogins as $login) {
        $normalizedLogin = strtolower(trim((string)$login));
        if ($normalizedLogin !== '') {
            $allowedLogins[] = $normalizedLogin;
        }
    }

    return array_values(array_unique($allowedLogins));
}

function github_user_is_allowed(array $config, string $login): bool
{
    $normalizedLogin = strtolower(trim($login));
    if ($normalizedLogin === '') {
        return false;
    }

    $allowedLogins = github_allowed_logins($config);
    if (!$allowedLogins) {
        return true;
    }

    return in_array($normalizedLogin, $allowedLogins, true);
}

function session_user(array $config): ?array
{
    $user = $_SESSION['user'] ?? null;
    if (!is_array($user)) {
        return null;
    }

    $login = (string)($user['login'] ?? '');
    $authProvider = (string)($user['authProvider'] ?? '');
    if ($authProvider === '' && $login !== '' && $login !== 'local-admin') {
        $authProvider = 'github';
    }

    if (oauth_is_configured($config) && ($authProvider === 'password' || $login === 'local-admin')) {
        unset($_SESSION['user']);
        return null;
    }

    if ($authProvider === 'github' && !github_user_is_allowed($config, $login)) {
        unset($_SESSION['user']);
        return null;
    }

    return $user;
}

function require_auth(array $config): void
{
    $user = session_user($config);
    if (!$user) {
        fail('Authentication required.', 401);
    }
}

function auth_with_password(array $config): void
{
    if (oauth_is_configured($config)) {
        fail('Password authentication is disabled when GitHub OAuth is configured.', 403);
    }

    $passwordHash = (string)($config['admin_password_hash'] ?? '');
    if (!$passwordHash) {
        fail('Password authentication is not configured.', 500);
    }

    $payload = read_json_body();
    $password = (string)($payload['password'] ?? '');
    if ($password === '' || !password_verify($password, $passwordHash)) {
        fail('Invalid password.', 401);
    }

    $_SESSION['user'] = [
        'authProvider' => 'password',
        'avatarUrl' => '',
        'login' => 'local-admin',
        'name' => 'Local Admin',
    ];
}

function auth_login(array $config): void
{
    if (!oauth_is_configured($config)) {
        fail('GitHub OAuth is not configured.', 500);
    }

    $state = bin2hex(random_bytes(16));
    $_SESSION['oauth_state'] = $state;
    $redirectUri = rtrim($config['app_base_url'], '/\\') . '/api/auth/callback';
    $query = http_build_query([
        'client_id' => $config['github_client_id'],
        'redirect_uri' => $redirectUri,
        'scope' => 'read:user user:email',
        'state' => $state,
    ]);

    header('Location: https://github.com/login/oauth/authorize?' . $query);
    exit;
}

function auth_callback(array $config): void
{
    $state = $_GET['state'] ?? '';
    $code = $_GET['code'] ?? '';

    if (!$state || !$code || $state !== ($_SESSION['oauth_state'] ?? '')) {
        fail('Invalid OAuth state.', 401);
    }

    $tokenResponse = http_json('https://github.com/login/oauth/access_token', [
        'method' => 'POST',
        'headers' => [
            'Accept: application/json',
            'Content-Type: application/x-www-form-urlencoded',
            'User-Agent: personal-website-blog-admin',
        ],
        'body' => http_build_query([
            'client_id' => $config['github_client_id'],
            'client_secret' => $config['github_client_secret'],
            'code' => $code,
            'redirect_uri' => rtrim($config['app_base_url'], '/\\') . '/api/auth/callback',
        ]),
    ]);

    $accessToken = $tokenResponse['access_token'] ?? '';
    if (!$accessToken) {
        fail('Unable to exchange OAuth code for an access token.', 401);
    }

    $user = http_json('https://api.github.com/user', [
        'headers' => [
            'Accept: application/json',
            'Authorization: token ' . $accessToken,
            'User-Agent: personal-website-blog-admin',
        ],
    ]);

    if (!github_user_is_allowed($config, (string)($user['login'] ?? ''))) {
        fail('This GitHub account is not allowed to access the admin.', 403);
    }

    $_SESSION['user'] = [
        'authProvider' => 'github',
        'avatarUrl' => $user['avatar_url'] ?? '',
        'login' => $user['login'] ?? '',
        'name' => $user['name'] ?? ($user['login'] ?? ''),
    ];

    unset($_SESSION['oauth_state']);
    header('Location: ' . rtrim($config['app_base_url'], '/\\') . '/');
    exit;
}
