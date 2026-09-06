<?php

require __DIR__ . '/bootstrap.php';

try {
    $config = load_app_config();
    bootstrap_storage($config);

    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $path = request_path();

    if ($method === 'GET' && $path === '/session') {
        $oauthConfigured = oauth_is_configured($config);
        $passwordAuthConfigured = !$oauthConfigured && (bool)($config['admin_password_hash'] ?? '');
        $user = session_user($config);

        json_response([
            'authenticated' => (bool)$user,
            'authConfigured' => $oauthConfigured || $passwordAuthConfigured,
            'oauthConfigured' => $oauthConfigured,
            'passwordAuthConfigured' => $passwordAuthConfigured,
            'user' => $user,
        ]);
    }

    if ($method === 'POST' && $path === '/logout') {
        $_SESSION = [];
        session_destroy();
        json_response(['ok' => true]);
    }

    if ($method === 'GET' && $path === '/auth/login') {
        auth_login($config);
    }

    if ($method === 'POST' && $path === '/auth/password') {
        auth_with_password($config);
        json_response([
            'authenticated' => true,
            'user' => $_SESSION['user'] ?? null,
        ]);
    }

    if ($method === 'GET' && $path === '/auth/callback') {
        auth_callback($config);
    }

    require_auth($config);

    if ($method === 'GET' && $path === '/articles') {
        json_response(['articles' => list_articles($config)]);
    }

    if ($method === 'POST' && $path === '/articles') {
        $article = save_article($config, normalize_article_payload(read_json_body()));
        if ($article['status'] === 'published') {
            rebuild_public_runtime($config);
        }

        json_response(['article' => $article], 201);
    }

    if ($method === 'GET' && preg_match('#^/articles/([^/]+)$#', $path, $matches)) {
        $article = find_article($config, $matches[1]);
        if (!$article) {
            fail('Article not found.', 404);
        }

        json_response(['article' => $article]);
    }

    if ($method === 'PUT' && preg_match('#^/articles/([^/]+)$#', $path, $matches)) {
        $existing = find_article($config, $matches[1]);
        if (!$existing) {
            fail('Article not found.', 404);
        }

        $article = save_article($config, normalize_article_payload(read_json_body(), $existing));
        if ($article['status'] === 'published') {
            rebuild_public_runtime($config);
        }

        json_response(['article' => $article]);
    }

    if ($method === 'DELETE' && preg_match('#^/articles/([^/]+)$#', $path, $matches)) {
        delete_article($config, $matches[1]);
        rebuild_public_runtime($config);
        json_response(['ok' => true]);
    }

    if ($method === 'POST' && preg_match('#^/articles/([^/]+)/publish$#', $path, $matches)) {
        $existing = find_article($config, $matches[1]);
        if (!$existing) {
            fail('Article not found.', 404);
        }

        $existing['status'] = 'published';
        if (!$existing['publishedAt']) {
            $existing['publishedAt'] = gmdate('c');
        }
        $existing['updatedAt'] = gmdate('c');
        $article = save_article($config, $existing);
        rebuild_public_runtime($config);
        json_response(['article' => $article]);
    }

    if ($method === 'POST' && preg_match('#^/articles/([^/]+)/unpublish$#', $path, $matches)) {
        $existing = find_article($config, $matches[1]);
        if (!$existing) {
            fail('Article not found.', 404);
        }

        $existing['status'] = 'draft';
        $existing['updatedAt'] = gmdate('c');
        $article = save_article($config, $existing);
        rebuild_public_runtime($config);
        json_response(['article' => $article]);
    }

    if ($method === 'GET' && $path === '/columns') {
        json_response(['columns' => load_columns($config)]);
    }

    if ($method === 'POST' && $path === '/columns') {
        $payload = read_json_body();
        $columns = load_columns($config);
        $slug = slugify_text((string)($payload['slug'] ?? $payload['name']['en'] ?? 'column'), 'column');

        foreach ($columns as $column) {
            if (($column['slug'] ?? '') === $slug) {
                fail('Column slug already exists.', 409);
            }
        }

        $column = [
            'slug' => $slug,
            'name' => [
                'en' => trim((string)($payload['name']['en'] ?? $slug)),
                'zh' => trim((string)($payload['name']['zh'] ?? $payload['name']['en'] ?? $slug)),
            ],
            'description' => [
                'en' => trim((string)($payload['description']['en'] ?? '')),
                'zh' => trim((string)($payload['description']['zh'] ?? '')),
            ],
        ];

        $columns[] = $column;
        save_columns($config, $columns);
        json_response(['column' => $column], 201);
    }

    if ($method === 'POST' && $path === '/assets/upload') {
        $articleId = trim((string)($_POST['articleId'] ?? ''));
        if (!$articleId) {
            fail('articleId is required for asset uploads.', 422);
        }

        $file = $_FILES['asset'] ?? null;
        if (!$file) {
            fail('No asset file was uploaded.', 422);
        }

        json_response(['asset' => store_uploaded_asset($config, $articleId, $file)], 201);
    }

    if ($method === 'POST' && $path === '/import/markdown') {
        $markdownFile = $_FILES['markdown'] ?? null;
        if (!$markdownFile || ($markdownFile['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            fail('A Markdown file is required.', 422);
        }

        $markdown = file_get_contents($markdownFile['tmp_name']);
        if ($markdown === false) {
            fail('Unable to read the uploaded Markdown file.', 500);
        }

        [$frontMatter, $contentMarkdown] = parse_front_matter($markdown);
        $baseArticle = normalize_article_payload([
            'contentMarkdown' => $contentMarkdown,
            'coverImage' => $frontMatter['coverImage'] ?? null,
            'column' => $frontMatter['column'] ?? '',
            'enableComments' => $frontMatter['enableComments'] ?? true,
            'excerpt' => $frontMatter['excerpt'] ?? '',
            'language' => $frontMatter['language'] ?? 'en',
            'pinOrder' => $frontMatter['pinOrder'] ?? 999,
            'pinned' => $frontMatter['pinned'] ?? false,
            'publishedAt' => $frontMatter['publishedAt'] ?? '',
            'seoDescription' => $frontMatter['seoDescription'] ?? '',
            'seoTitle' => $frontMatter['seoTitle'] ?? '',
            'slug' => $frontMatter['slug'] ?? '',
            'status' => $_POST['status'] ?? ($frontMatter['status'] ?? 'draft'),
            'tags' => $frontMatter['tags'] ?? [],
            'title' => $frontMatter['title'] ?? 'Imported article',
            'type' => $frontMatter['type'] ?? 'note',
        ]);

        $assetMap = [];
        foreach (normalize_uploaded_files($_FILES, 'assets') as $file) {
            $stored = store_uploaded_asset($config, $baseArticle['id'], $file);
            $assetMap[basename($stored['name'])] = $stored['url'];
        }

        $baseArticle['contentMarkdown'] = rewrite_markdown_asset_paths($baseArticle['contentMarkdown'], $assetMap);
        if ($baseArticle['coverImage']) {
            $coverBaseName = basename((string)$baseArticle['coverImage']);
            if (isset($assetMap[$coverBaseName])) {
                $baseArticle['coverImage'] = $assetMap[$coverBaseName];
            }
        }

        $article = save_article($config, $baseArticle);
        if ($article['status'] === 'published') {
            rebuild_public_runtime($config);
        }

        json_response(['article' => $article], 201);
    }

    fail('API route not found.', 404);
} catch (RuntimeException $exception) {
    $statusCode = $exception->getCode();
    if ($statusCode < 400 || $statusCode >= 600) {
        $statusCode = 500;
    }

    json_response(['error' => $exception->getMessage()], $statusCode);
}
