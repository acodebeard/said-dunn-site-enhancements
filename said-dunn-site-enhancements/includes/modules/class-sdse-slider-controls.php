<?php
/**
 * Accessible Featured Slider Controls module.
 *
 * @package SaidDunnSiteEnhancements
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Loads the isolated frontend assets for the featured slider enhancement.
 */
final class SDSE_Slider_Controls {

	/**
	 * Plugin settings service.
	 *
	 * @var SDSE_Settings
	 */
	private $settings;

	/**
	 * Creates the module.
	 *
	 * @param SDSE_Settings $settings Plugin settings service.
	 */
	public function __construct( SDSE_Settings $settings ) {
		$this->settings = $settings;
	}

	/**
	 * Registers this module's hooks.
	 *
	 * @return void
	 */
	public function register_hooks() {
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );
	}

	/**
	 * Loads assets only in the frontend contexts where a featured slider belongs.
	 *
	 * @return void
	 */
	public function enqueue_assets() {
		if ( ! $this->settings->slider_controls_enabled() || ! $this->should_load() ) {
			return;
		}

		wp_enqueue_style(
			'sdse-slider-controls',
			SDSE_PLUGIN_URL . 'assets/css/slider-controls.css',
			array(),
			SDSE_VERSION
		);

		wp_enqueue_script(
			'sdse-slider-controls',
			SDSE_PLUGIN_URL . 'assets/js/slider-controls.js',
			array(),
			SDSE_VERSION,
			true
		);

		wp_localize_script(
			'sdse-slider-controls',
			'SDSESliderControls',
			array(
				'slideDelay' => 7000,
				'labels'     => array(
					'carousel'           => __( 'carousel', 'said-dunn-site-enhancements' ),
					'region'             => __( 'Featured content slider', 'said-dunn-site-enhancements' ),
					'previous'           => __( 'Previous slide', 'said-dunn-site-enhancements' ),
					'next'               => __( 'Next slide', 'said-dunn-site-enhancements' ),
					'pause'              => __( 'Pause', 'said-dunn-site-enhancements' ),
					'pauseLabel'         => __( 'Pause slideshow', 'said-dunn-site-enhancements' ),
					'play'               => __( 'Play', 'said-dunn-site-enhancements' ),
					'playLabel'          => __( 'Play slideshow', 'said-dunn-site-enhancements' ),
					'paused'             => __( 'Slideshow paused.', 'said-dunn-site-enhancements' ),
					'playing'            => __( 'Slideshow playing.', 'said-dunn-site-enhancements' ),
					'resumeAfterHover'   => __( 'Slideshow will resume when the pointer leaves.', 'said-dunn-site-enhancements' ),
					'reducedMotionPause' => __( 'Slideshow paused because reduced motion is enabled.', 'said-dunn-site-enhancements' ),
				),
			)
		);
	}

	/**
	 * Determines whether slider assets belong on the current request.
	 *
	 * Front-page and posts-index requests are the only default contexts. The
	 * filter exists for a version-controlled site integration that deliberately
	 * places the featured slider elsewhere; there is no selector or code editor.
	 *
	 * @return bool
	 */
	private function should_load() {
		$should_load = ! is_admin() && ( is_front_page() || is_home() );

		/**
		 * Filters whether the Accessible Featured Slider Controls assets load.
		 *
		 * @since 1.0.0
		 *
		 * @param bool $should_load Default decision for the current request.
		 */
		return (bool) apply_filters( 'sdse_slider_controls_should_load', $should_load );
	}
}
