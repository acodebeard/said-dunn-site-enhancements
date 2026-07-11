# Said & Dunn Site Enhancements

A site-specific WordPress compatibility and enhancement plugin for Said & Dunn.
It contains narrowly scoped, maintainable frontend corrections that cannot be
configured through the active classic theme or WordPress.com interface.

The current module, **Accessible Featured Slider Controls**, integrates with the
BlogData theme's featured Swiper slider. It provides accessible Previous/Next
labels, a working Pause/Play control, pause-on-hover behavior, reduced-motion
support, and a seven-second autoplay delay.

## Install

1. Download `said-dunn-site-enhancements.zip` from the
   [v1.0.2 release](https://github.com/acodebeard/said-dunn-site-enhancements/releases/tag/v1.0.2).
2. In WordPress Admin, open **Plugins > Add New Plugin > Upload Plugin**.
3. Upload the ZIP, install it, and activate **Said & Dunn Site Enhancements**.
4. Open **Settings > Site Enhancements** to confirm the slider module is enabled.

The BlogData-specific visual override is available separately as
[`said-dunn-blogdata-slider-controls.css`](said-dunn-blogdata-slider-controls.css)
for the site's Additional CSS area.

## Development

Install dependencies:

```bash
composer install
npm ci
```

Run the complete local checks:

```bash
composer run phpcs
composer run phpstan
npm run check:js
npm test
```

Build the installable ZIP:

```bash
scripts/build-release.sh
```

The generated ZIP, Composer `vendor/`, Node `node_modules/`, and test screenshots
are intentionally excluded from source control.

## Requirements

- WordPress 6.0 or later
- PHP 7.4 or later

## Security

Please report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## License

GPL-2.0-or-later. See [LICENSE](LICENSE).
