<?php
/**
 * Plugin settings.
 *
 * @package SaidDunnSiteEnhancements
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Provides the small, purpose-specific settings surface for enhancements.
 */
final class SDSE_Settings {

	/**
	 * Database option containing all plugin settings.
	 */
	const OPTION_NAME = 'sdse_settings';

	/**
	 * Settings API group.
	 */
	const OPTION_GROUP = 'sdse_settings_group';

	/**
	 * Admin settings page slug.
	 */
	const PAGE_SLUG = 'said-dunn-site-enhancements';

	/**
	 * Registers admin hooks.
	 *
	 * @return void
	 */
	public function register_hooks() {
		add_action( 'admin_init', array( $this, 'register_settings' ) );
		add_action( 'admin_menu', array( $this, 'add_settings_page' ) );
		add_filter(
			'plugin_action_links_' . plugin_basename( SDSE_PLUGIN_FILE ),
			array( $this, 'add_action_links' )
		);
	}

	/**
	 * Returns defaults in one place for frontend and admin use.
	 *
	 * @return array<string, bool>
	 */
	public static function get_defaults() {
		return array(
			'slider_controls_enabled' => true,
		);
	}

	/**
	 * Returns sanitized settings merged with defaults.
	 *
	 * @return array<string, bool>
	 */
	public function get_options() {
		$options = get_option( self::OPTION_NAME, array() );

		if ( ! is_array( $options ) ) {
			$options = array();
		}

		$options = wp_parse_args( $options, self::get_defaults() );

		return array(
			'slider_controls_enabled' => ! empty( $options['slider_controls_enabled'] ),
		);
	}

	/**
	 * Reports whether the slider enhancement is enabled.
	 *
	 * @return bool
	 */
	public function slider_controls_enabled() {
		$options = $this->get_options();

		return $options['slider_controls_enabled'];
	}

	/**
	 * Registers the option, section, and field with the Settings API.
	 *
	 * @return void
	 */
	public function register_settings() {
		register_setting(
			self::OPTION_GROUP,
			self::OPTION_NAME,
			array(
				'type'              => 'array',
				'description'       => __( 'Said & Dunn Site Enhancements settings.', 'said-dunn-site-enhancements' ),
				'sanitize_callback' => array( $this, 'sanitize_options' ),
				'default'           => self::get_defaults(),
				'show_in_rest'      => false,
			)
		);

		add_settings_section(
			'sdse_accessible_slider_controls',
			__( 'Accessible Featured Slider Controls', 'said-dunn-site-enhancements' ),
			array( $this, 'render_slider_section' ),
			self::PAGE_SLUG
		);

		add_settings_field(
			'sdse_slider_controls_enabled',
			__( 'Status', 'said-dunn-site-enhancements' ),
			array( $this, 'render_slider_enabled_field' ),
			self::PAGE_SLUG,
			'sdse_accessible_slider_controls',
			array(
				'label_for' => 'sdse_slider_controls_enabled',
			)
		);
	}

	/**
	 * Restricts saved data to the named settings this plugin supports.
	 *
	 * @param mixed $input Raw option value submitted to WordPress.
	 * @return array<string, bool>
	 */
	public function sanitize_options( $input ) {
		if ( ! is_array( $input ) ) {
			$input = array();
		}

		return array(
			'slider_controls_enabled' => isset( $input['slider_controls_enabled'] ) && '1' === (string) $input['slider_controls_enabled'],
		);
	}

	/**
	 * Adds the page under the standard Settings menu.
	 *
	 * @return void
	 */
	public function add_settings_page() {
		add_options_page(
			__( 'Said & Dunn Site Enhancements', 'said-dunn-site-enhancements' ),
			__( 'Site Enhancements', 'said-dunn-site-enhancements' ),
			'manage_options',
			self::PAGE_SLUG,
			array( $this, 'render_settings_page' )
		);
	}

	/**
	 * Describes the slider module without exposing implementation details.
	 *
	 * @return void
	 */
	public function render_slider_section() {
		printf(
			'<p>%s</p>',
			esc_html__( 'Improves the existing featured slider controls and adds a working Pause/Play control when the theme exposes a supported autoplay API.', 'said-dunn-site-enhancements' )
		);
	}

	/**
	 * Renders the module's enable/disable checkbox.
	 *
	 * @return void
	 */
	public function render_slider_enabled_field() {
		$options = $this->get_options();
		?>
		<label for="sdse_slider_controls_enabled">
			<input
				type="checkbox"
				id="sdse_slider_controls_enabled"
				name="<?php echo esc_attr( self::OPTION_NAME ); ?>[slider_controls_enabled]"
				value="1"
				<?php checked( $options['slider_controls_enabled'] ); ?>
			/>
			<?php esc_html_e( 'Enable accessible featured slider controls', 'said-dunn-site-enhancements' ); ?>
		</label>
		<p class="description">
			<?php esc_html_e( 'The frontend assets load only on the front page or posts page. Unsupported sliders are left unchanged except for safe accessibility labeling of recognized controls.', 'said-dunn-site-enhancements' ); ?>
		</p>
		<?php
	}

	/**
	 * Renders the complete settings page.
	 *
	 * @return void
	 */
	public function render_settings_page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php esc_html_e( 'Said & Dunn Site Enhancements', 'said-dunn-site-enhancements' ); ?></h1>
			<p><?php esc_html_e( 'Site-specific enhancements are kept as small, independent modules. This page exposes only the settings each module needs.', 'said-dunn-site-enhancements' ); ?></p>
			<?php settings_errors(); ?>
			<form action="options.php" method="post">
				<?php
				settings_fields( self::OPTION_GROUP );
				do_settings_sections( self::PAGE_SLUG );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}

	/**
	 * Adds a direct Settings link to the Plugins screen.
	 *
	 * @param string[] $links Existing plugin action links.
	 * @return string[]
	 */
	public function add_action_links( $links ) {
		$url = add_query_arg(
			array( 'page' => self::PAGE_SLUG ),
			admin_url( 'options-general.php' )
		);

		array_unshift(
			$links,
			sprintf(
				'<a href="%1$s">%2$s</a>',
				esc_url( $url ),
				esc_html__( 'Settings', 'said-dunn-site-enhancements' )
			)
		);

		return $links;
	}
}
