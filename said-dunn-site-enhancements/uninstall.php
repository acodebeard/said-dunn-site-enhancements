<?php
/**
 * Removes all plugin-owned settings when the plugin is deleted.
 *
 * @package SaidDunnSiteEnhancements
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

$sdse_delete_settings = static function () {
	delete_option( 'sdse_settings' );
};

if ( is_multisite() ) {
	$sdse_site_ids = get_sites(
		array(
			'fields' => 'ids',
			'number' => 0,
		)
	);

	foreach ( $sdse_site_ids as $sdse_site_id ) {
		switch_to_blog( (int) $sdse_site_id );
		$sdse_delete_settings();
		restore_current_blog();
	}

	delete_site_option( 'sdse_settings' );
} else {
	$sdse_delete_settings();
}
