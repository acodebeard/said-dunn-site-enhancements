'use strict';

const assert = require( 'node:assert/strict' );
const fs = require( 'node:fs' );
const path = require( 'node:path' );
const test = require( 'node:test' );
const { JSDOM } = require( 'jsdom' );

const script = fs.readFileSync(
	path.join( __dirname, '..', 'said-dunn-site-enhancements', 'assets', 'js', 'slider-controls.js' ),
	'utf8'
);

async function createPage( { broken = false, supported = true, reducedMotion = false } = {} ) {
	const dom = new JSDOM(
		`<!doctype html>
		<html><body>
			<div class="featured-slider">
				<div class="featured-content-inner">
					<article>First</article>
					<article>Second</article>
				</div>
				<div class="slider-prev">‹</div>
				<a class="slider-next" href="#">›</a>
			</div>
		</body></html>`,
		{
			pretendToBeVisual: true,
			runScripts: 'outside-only',
			url: 'https://example.test/'
		}
	);
	const { window } = dom;
	const nativeSetTimeout = window.setTimeout.bind( window );
	const flush = ( milliseconds = 50 ) => new Promise( ( resolve ) => nativeSetTimeout( resolve, milliseconds ) );
	const root = window.document.querySelector( '.featured-slider' );
	const calls = { pause: 0, play: 0 };
	const instance = {
		playing: true,
		vars: { slideshow: true },
		pause() {
			calls.pause += 1;
			if ( broken ) {
				throw new Error( 'Slider API failed.' );
			}
			this.playing = false;
		},
		play() {
			calls.play += 1;
			this.playing = true;
		}
	};

	// Keep the module's delayed production rescans inside the test lifetime.
	window.setTimeout = ( callback, delay, ...args ) => nativeSetTimeout( callback, Math.min( delay, 10 ), ...args );

	window.matchMedia = () => ( {
		addEventListener() {},
		matches: reducedMotion
	} );

	window.SDSESliderControls = {
		slideDelay: 7000,
		labels: {
			carousel: 'carousel',
			next: 'Next slide',
			pause: 'Pause slideshow',
			paused: 'Slideshow paused.',
			play: 'Play slideshow',
			playing: 'Slideshow playing.',
			previous: 'Previous slide',
			reducedMotionPause: 'Reduced motion pause.',
			resumeAfterHover: 'Resume after hover.',
			region: 'Featured content slider'
		}
	};

	window.jQuery = ( element ) => ( {
		data: () => supported && element === root ? { featuredSlider: instance } : {},
		hasClass: () => false
	} );

	window.eval( script );
	if ( 'complete' !== window.document.readyState ) {
		await new Promise( ( resolve ) => window.addEventListener( 'load', resolve, { once: true } ) );
	}
	await flush();

	return { calls, dom, flush, instance, root, window };
}

test( 'enhances direction controls and connects a verified pause API', async () => {
	const page = await createPage();
	const previous = page.root.querySelector( '.slider-prev' );
	const next = page.root.querySelector( '.slider-next' );
	const toggle = page.root.querySelector( '.sdse-slider-toggle' );

	assert.equal( page.root.getAttribute( 'role' ), 'region' );
	assert.equal( page.root.getAttribute( 'aria-label' ), 'Featured content slider' );
	assert.equal( previous.getAttribute( 'aria-label' ), 'Previous slide' );
	assert.equal( previous.getAttribute( 'role' ), 'button' );
	assert.equal( previous.getAttribute( 'tabindex' ), '0' );
	assert.equal( next.getAttribute( 'aria-label' ), 'Next slide' );
	assert.equal( toggle.textContent, 'Pause slideshow' );

	toggle.click();
	assert.equal( page.calls.pause, 1 );
	assert.equal( toggle.textContent, 'Play slideshow' );

	toggle.click();
	assert.equal( page.calls.play, 1 );
	assert.equal( toggle.textContent, 'Pause slideshow' );

	page.root.appendChild( page.window.document.createElement( 'span' ) );
	await page.flush();
	assert.equal( page.root.querySelectorAll( '.sdse-slider-toggle' ).length, 1 );

} );

test( 'does not render a fake Pause/Play control for an unsupported slider', async () => {
	const page = await createPage( { supported: false } );

	assert.equal( page.root.querySelector( '.sdse-slider-toggle' ), null );
	assert.equal( page.root.querySelector( '.slider-prev' ).getAttribute( 'aria-label' ), 'Previous slide' );
	assert.equal( page.root.querySelector( '.slider-next' ).getAttribute( 'aria-label' ), 'Next slide' );

} );

test( 'starts a supported autoplay slider paused when reduced motion is requested', async () => {
	const page = await createPage( { reducedMotion: true } );
	const toggle = page.root.querySelector( '.sdse-slider-toggle' );

	assert.equal( page.calls.pause, 1 );
	assert.equal( toggle.textContent, 'Play slideshow' );

} );

test( 'pauses on hover and does not resume after a persistent pause', async () => {
	const page = await createPage();
	const toggle = page.root.querySelector( '.sdse-slider-toggle' );

	page.root.dispatchEvent( new page.window.Event( 'mouseenter' ) );
	assert.equal( page.calls.pause, 1 );
	assert.equal( toggle.textContent, 'Pause slideshow' );

	page.root.dispatchEvent( new page.window.Event( 'mouseleave' ) );
	assert.equal( page.calls.play, 1 );

	toggle.click();
	assert.equal( page.calls.pause, 2 );
	assert.equal( toggle.textContent, 'Play slideshow' );

	page.root.dispatchEvent( new page.window.Event( 'mouseenter' ) );
	page.root.dispatchEvent( new page.window.Event( 'mouseleave' ) );
	assert.equal( page.calls.play, 1 );
} );

test( 'removes a control permanently when the advertised slider API fails', async () => {
	const page = await createPage( { broken: true, reducedMotion: true } );

	assert.equal( page.calls.pause, 1 );
	assert.equal( page.root.querySelector( '.sdse-slider-toggle' ), null );

	page.root.appendChild( page.window.document.createElement( 'span' ) );
	await page.flush();
	assert.equal( page.calls.pause, 1 );
	assert.equal( page.root.querySelector( '.sdse-slider-toggle' ), null );
} );

test( 'integrates with the BlogData homemain Swiper slider', async () => {
	const dom = new JSDOM(
		`<!doctype html>
		<html><body>
			<div class="homemain bs swiper-container">
				<div class="swiper-wrapper">
					<div class="swiper-slide">First post</div>
					<div class="swiper-slide">Second post</div>
				</div>
				<div class="swiper-button-next"></div>
				<div class="swiper-button-prev"></div>
			</div>
		</body></html>`,
		{
			pretendToBeVisual: true,
			runScripts: 'outside-only',
			url: 'https://example.test/'
		}
	);
	const { window } = dom;
	const nativeSetTimeout = window.setTimeout.bind( window );
	const root = window.document.querySelector( '.homemain' );
	const calls = { pause: 0, start: 0, stop: 0 };

	window.setTimeout = ( callback, delay, ...args ) => nativeSetTimeout( callback, Math.min( delay, 10 ), ...args );
	window.matchMedia = () => ( {
		addEventListener() {},
		matches: false
	} );
	window.SDSESliderControls = {
		slideDelay: 7000,
		labels: {
			carousel: 'carousel',
			next: 'Next slide',
			pause: 'Pause slideshow',
			paused: 'Slideshow paused.',
			play: 'Play slideshow',
			playing: 'Slideshow playing.',
			previous: 'Previous slide',
			resumeAfterHover: 'Resume after hover.',
			region: 'Featured content slider'
		}
	};
	root.swiper = {
		params: { autoplay: { delay: 3000 } },
		autoplay: {
			paused: false,
			running: true,
			pause() {
				calls.pause += 1;
				this.paused = true;
			},
			start() {
				calls.start += 1;
				this.running = true;
			},
			stop() {
				calls.stop += 1;
				this.running = false;
			}
		}
	};

	window.eval( script );
	if ( 'complete' !== window.document.readyState ) {
		await new Promise( ( resolve ) => window.addEventListener( 'load', resolve, { once: true } ) );
	}
	await new Promise( ( resolve ) => nativeSetTimeout( resolve, 50 ) );

	const toggle = root.querySelector( '.sdse-slider-toggle' );
	assert.equal( root.getAttribute( 'aria-label' ), 'Featured content slider' );
	assert.equal( root.querySelector( '.swiper-button-prev' ).getAttribute( 'aria-label' ), 'Previous slide' );
	assert.equal( root.querySelector( '.swiper-button-next' ).getAttribute( 'aria-label' ), 'Next slide' );
	assert.equal( toggle.textContent, 'Pause slideshow' );
	assert.equal( root.swiper.params.autoplay.delay, 7000 );
	assert.equal( calls.stop, 1 );
	assert.equal( calls.start, 1 );

	toggle.click();
	assert.equal( calls.stop, 2 );
	assert.equal( calls.pause, 0 );
	assert.equal( toggle.textContent, 'Play slideshow' );

	toggle.click();
	assert.equal( calls.start, 2 );
	assert.equal( toggle.textContent, 'Pause slideshow' );
} );
