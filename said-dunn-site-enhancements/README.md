# Said & Dunn Site Enhancements

A site-specific WordPress plugin for small, maintainable frontend corrections
that cannot be configured through the active classic theme or WordPress.com.

Project site: <https://github.com/acodebeard/said-dunn-site-enhancements>

- Version: 1.0.2
- Requires WordPress: 6.0 or later
- Requires PHP: 7.4 or later
- License: GPL-2.0-or-later

## Included module

### Accessible Featured Slider Controls

When enabled, this module loads only on the front page and posts page. It:

- Identifies featured slider markup using a short, version-controlled list of
  common classic-theme markers.
- Gives the slider a region name when the theme has not provided one.
- Adds accessible names and `aria-controls` relationships to recognized
  Previous and Next controls without replacing existing theme wording.
- Makes non-native direction controls keyboard operable while preserving native
  links and buttons.
- Adds a visible Pause/Play button only when a real, supported autoplay API is
  present.
- Pauses autoplay while a pointer is over the slider and resumes on pointer
  leave unless the visitor selected a persistent pause.
- Uses a seven-second autoplay delay for BlogData's featured slider so visitors
  have more time to read each slide.
- Pauses supported autoplay for visitors whose operating system requests
  reduced motion. It does not automatically resume if that preference changes.
- Re-checks after page load and DOM updates so delayed theme initialization is
  handled.

The module recognizes common FlexSlider-style jQuery instances (including
theme-specific instances exposing `pause()` and `play()`), Slick, Swiper, and
Splide. If no safe API is available, no Pause/Play button is rendered. This is
intentional: the plugin does not display a control that cannot reliably stop the
slider.

## Installation

1. In WordPress Admin, open **Plugins > Add New Plugin > Upload Plugin**.
2. Select `said-dunn-site-enhancements.zip`.
3. Install and activate the plugin.
4. Open **Settings > Site Enhancements**.
5. Confirm that **Enable accessible featured slider controls** is checked and
   save if you made a change.

The module is enabled by default. It creates no posts, users, custom tables,
cookies, scheduled events, or external requests.

## Post-install verification

On a page containing the featured slider:

1. Confirm that existing Previous and Next controls still change slides.
2. Navigate using only the keyboard and verify every visible control has a clear
   focus indicator and activates with its normal key behavior.
3. If the slider advances automatically, confirm that **Pause slideshow** stops
   it and changes to **Play slideshow**.
4. Turn on the operating system's reduced-motion preference, reload the page,
   and confirm supported autoplay starts paused.
5. Check a normal interior page and confirm the module's stylesheet and script
   are not enqueued.

If the theme's slider uses an unrecognized API, leave the module enabled for the
safe labeling improvements and add a narrowly scoped adapter to
`assets/js/slider-controls.js` after inspecting the live markup and theme API.
Do not add a selector or arbitrary-code setting.

## Settings and removal

The plugin stores one option, `sdse_settings`, containing the module's enabled
state. Deactivation leaves that preference in place. Deleting the plugin through
WordPress removes it on both single-site and multisite installations.

## Adding a future enhancement

Keep each enhancement in its own class under `includes/modules/`, with its own
assets under `assets/`. Register the class in the small modules array in
`includes/class-sdse-plugin.php`. Add only purpose-specific settings through
`SDSE_Settings`; do not add raw code, selectors, JSON, or a snippets interface.

## Changelog

### 1.0.2

- Fixed reliable autoplay restart for BlogData's bundled Swiper 6 API.
- Added pause on hover while preserving manual and reduced-motion pauses.
- Increased the BlogData featured-slider delay from three to seven seconds.

### 1.0.1

- Added direct integration with BlogData's `.homemain` featured Swiper slider.

### 1.0.0

- Initial release.
- Added the Accessible Featured Slider Controls module.
