<?php
/**
 * Plugin Name:       Said & Dunn Site Enhancements
 * Plugin URI:        https://github.com/acodebeard/said-dunn-site-enhancements
 * Description:       Site-specific accessibility and theme-compatibility enhancements for Said & Dunn.
 * Version:           1.0.2
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            acodebeard
 * Author URI:        https://github.com/acodebeard
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       said-dunn-site-enhancements
 *
 * @package SaidDunnSiteEnhancements
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'SDSE_VERSION', '1.0.2' );
define( 'SDSE_PLUGIN_FILE', __FILE__ );
define( 'SDSE_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'SDSE_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once SDSE_PLUGIN_DIR . 'includes/class-sdse-settings.php';
require_once SDSE_PLUGIN_DIR . 'includes/modules/class-sdse-slider-controls.php';
require_once SDSE_PLUGIN_DIR . 'includes/class-sdse-plugin.php';

/**
 * Starts the plugin after all active plugins have loaded.
 *
 * @return void
 */
function sdse_run_plugin() {
	$plugin = new SDSE_Plugin();
	$plugin->run();
}

add_action( 'plugins_loaded', 'sdse_run_plugin' );
