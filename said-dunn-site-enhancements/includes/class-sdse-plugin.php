<?php
/**
 * Main plugin coordinator.
 *
 * @package SaidDunnSiteEnhancements
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Connects settings and individual enhancement modules to WordPress.
 */
final class SDSE_Plugin {

	/**
	 * Prevents hooks from being registered more than once.
	 *
	 * @var bool
	 */
	private $has_run = false;

	/**
	 * Registers plugin services and modules.
	 *
	 * A future enhancement needs only its own class plus one entry in the
	 * modules array below. Modules remain responsible for their own hooks and
	 * assets, so removing one does not affect the others.
	 *
	 * @return void
	 */
	public function run() {
		if ( $this->has_run ) {
			return;
		}

		$this->has_run = true;

		$settings = new SDSE_Settings();
		$settings->register_hooks();

		$modules = array(
			new SDSE_Slider_Controls( $settings ),
		);

		foreach ( $modules as $module ) {
			$module->register_hooks();
		}
	}
}
