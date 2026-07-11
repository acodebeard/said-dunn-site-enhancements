<?php
/**
 * Analysis-only values for constants defined by the plugin bootstrap at runtime.
 */

if ( ! defined( 'ABSPATH' ) ) {
	define( 'ABSPATH', __DIR__ . '/' );
}

if ( ! defined( 'SDSE_VERSION' ) ) {
	define( 'SDSE_VERSION', '1.0.2' );
}

if ( ! defined( 'SDSE_PLUGIN_FILE' ) ) {
	define( 'SDSE_PLUGIN_FILE', __DIR__ . '/../said-dunn-site-enhancements/said-dunn-site-enhancements.php' );
}

if ( ! defined( 'SDSE_PLUGIN_DIR' ) ) {
	define( 'SDSE_PLUGIN_DIR', __DIR__ . '/../said-dunn-site-enhancements/' );
}

if ( ! defined( 'SDSE_PLUGIN_URL' ) ) {
	define( 'SDSE_PLUGIN_URL', 'https://example.invalid/wp-content/plugins/said-dunn-site-enhancements/' );
}

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	define( 'WP_UNINSTALL_PLUGIN', true );
}
