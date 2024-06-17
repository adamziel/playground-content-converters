<?php
/**
 * Plugin Name: Import static files to WordPress
 */

require_once __DIR__ . '/playground-post-import-processor.php';

define("EXTENSION", ".blockhtml");
// define("INDEX_FILE_NAME", "01-index");
define("INDEX_FILE_NAME", "README");
define("INDEX_FILE", INDEX_FILE_NAME . EXTENSION);

// Disable KSES filters for all users
remove_filter('content_save_pre', 'wp_filter_post_kses');
remove_filter('content_filtered_save_pre', 'wp_filter_post_kses');
remove_filter('excerpt_save_pre', 'wp_filter_post_kses');
remove_filter('textarea_pre', 'wp_filter_kses');
remove_filter('pre_comment_content', 'wp_filter_kses');
remove_filter('title_save_pre', 'wp_filter_kses');

// Allow unfiltered HTML for all users, including administrators and non-administrators
function allow_unfiltered_html($caps, $cap, $user_id) {
    if ($cap === 'unfiltered_html') {
        $caps = array();
    }
    return $caps;
}
add_filter('map_meta_cap', 'allow_unfiltered_html', 1, 3);

function import_static_files_from_directory($static_files_path) {
	$files = get_block_markup_files_to_import($static_files_path);
	$admin_id = get_admin_id();
	create_pages($files, $admin_id);
    update_option('docs_populated', true);
}

function get_block_markup_files_to_import($dir) {
    $files = array();
    function scan_directory($dir) {
        $files = array();

        if (is_dir($dir)) {
            $dh = opendir($dir);
            while (($file = readdir($dh)) !== false) {
                if ($file != "." && $file != "..") {
                    $filePath = $dir . '/' . $file;
                    if (is_dir($filePath)) {
                        $nestedFiles = scan_directory($filePath);
                        $files = array_merge($files, $nestedFiles);
                    } elseif (str_ends_with(strtolower($file), EXTENSION)) {
                        $extensionless_path = substr($filePath, 0, -strlen(EXTENSION));
                        $markdown_path = $extensionless_path . '.md';
                        $files[] = array(
                            'path' => $filePath,
                            'name' => str_ends_with($file, INDEX_FILE)
                                ? basename(dirname($extensionless_path))
                                : basename($extensionless_path),
                            'content' => file_get_contents($filePath),
                            'markdown' => file_get_contents($markdown_path),
                        );
                    }
                }
            }
            closedir($dh);
        }

        return $files;
    }

    $files = scan_directory($dir);
	return $files;
}

function get_admin_id() {
	$admins = get_users(array(
		'role' => 'administrator',
		'orderby' => 'ID',
		'order' => 'ASC',
		'number' => 1
	));

	// Check if there is at least one admin
	if (!empty($admins)) {
		return $admins[0]->ID;
	}
}

function create_pages($pages, $author_id)
{
    $by_path = [];
    foreach($pages as $page) {
        $by_path[$page['path']] = $page;
    }
    sortByKeyLengthAndReadme($by_path);

    $ids_by_path = [];
    foreach($by_path as $page) {
        if(str_ends_with($page['path'], '/' . INDEX_FILE)) {
            $parent_path = dirname(dirname($page['path'])) . '/' . INDEX_FILE;
        } else {
            $parent_path = dirname($page['path']) . '/' . INDEX_FILE;
        }
        if (isset($ids_by_path[$parent_path])) {
            $parent_id = $ids_by_path[$parent_path];
        } else {
            $parent_id = null;
        }
        echo "Creating page: " . $page['path'] . " (parent: $parent_path, parent ID: ".$parent_id.")\n";
        $ids_by_path[$page['path']] = create_page($page, $parent_id, $author_id);
    }
    return $ids_by_path;
}

function create_page($page, $parent_id=null, $author_id) {
    $post_title = $page['name'];

    // Source the page title from the first heading in the document.
    $content = $page['content'];
    $p = new Playground_Post_Import_Processor($content);
    $seen_no_meaningful_content = true;
    while($p->next_token()) {
        $token_type = $p->get_token_type();
        if(
            $token_type === '#funky-comment' ||
            $token_type === '#cdata-section' ||
            ($token_type === '#comment' && str_starts_with($p->get_modifiable_text(), ' wp:heading ')) ||
            ($token_type === '#text' && trim($p->get_modifiable_text()) === '')
        ) {
            continue;
        }
        if(!in_array($p->get_tag(), array('H1','H2','H3','H4','H5','H6'), true)) {
            $seen_no_meaningful_content = false;
            continue;
        }

        $p->set_bookmark('start');

        // Find the text node inside the heading
        $p->next_token();

        // Extract the text node content
        $inner_text = trim($p->get_modifiable_text());
        if($inner_text) {
            $post_title = $inner_text;
        }

        if ($seen_no_meaningful_content) {
            // If nothing other than the heading has been seen yet, we can remove
            // the content up to the current token to avoid creating a post with
            // duplication between the post title and the very first block (heading).
            // 
            // Let's look for the header closer within the next 3 tokens:
            // * h1 closer
            // * optional empty text node
            // * the closing comment
            for ($i = 0; $i < 3; $i++) {
                $p->next_token();
                if (
                    $p->get_token_type() === '#comment' &&
                    $p->get_modifiable_text() === ' /wp:heading '
                ) {
                    $bookmark = $p->get_token_indices();
                    $content = substr($content, $bookmark->start + $bookmark->length);
                    break;
                }
            }
        }

        break;
    }

	$post_id = wp_insert_post(array(
		'post_title' => $post_title,
		'post_content' => wp_slash($content),
		'post_status' => 'publish',
		'post_type' => 'page',
		'post_parent' => $parent_id,
		'post_author' => $author_id,
        'post_name' => $page['name'],
        'meta_input' => array(
            'markdown_content' => wp_slash($page['markdown']),
        ),
	));
    
    if (is_wp_error($post_id)) {
        exit(1);
    }

	return $post_id;
}

function sortByKeyLengthAndReadme(&$array) {
    // Step 1: Extract the keys and sort them
    $keys = array_keys($array);

    usort($keys, function($a, $b) {
        // Bubble the index file to the top within the same directory
        if (basename($a) === INDEX_FILE && basename($b) === INDEX_FILE) {
            return strlen($a) <=> strlen($b);
        }
        if (basename($a) === INDEX_FILE) return -1;
        if (basename($b) === INDEX_FILE) return 1;
        return strlen($a) <=> strlen($b);
    });

    // Step 2: Re-create the array with sorted keys
    $sorted = [];
    foreach ($keys as $key) {
        $sorted[$key] = $array[$key];
    }

    $array = $sorted;
}
