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
					<article><a href="/first">First</a></article>
					<article>Second</article>
				</div>
				<div class="slider-prev" role="button" tabindex="0">‹</div>
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
			pause: 'Pause',
			pauseLabel: 'Pause slideshow',
			paused: 'Slideshow paused.',
			play: 'Play',
			playLabel: 'Play slideshow',
			playing: 'Slideshow playing.',
			previous: 'Previous slide',
			reducedMotionPause: 'Reduced motion pause.',
			resumeAfterInteraction: 'Resume after focus and hover.',
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
	assert.equal( previous.getAttribute( 'role' ), 'button' );
	assert.equal( previous.getAttribute( 'tabindex' ), '0' );
	assert.equal( previous.getAttribute( 'aria-label' ), 'Previous slide' );
	assert.equal( previous.getAttribute( 'aria-controls' ), page.root.id );
	assert.equal( previous.querySelector( 'button' ), null );
	assert.equal( next.getAttribute( 'aria-label' ), 'Next slide' );
	assert.equal( toggle.textContent, 'Pause' );
	assert.equal( toggle.getAttribute( 'aria-label' ), 'Pause slideshow' );

	let previousClicks = 0;
	previous.addEventListener( 'click', () => {
		previousClicks += 1;
	} );
	previous.dispatchEvent( new page.window.KeyboardEvent( 'keydown', { key: 'Enter' } ) );
	assert.equal( previousClicks, 1 );

	toggle.click();
	assert.equal( page.calls.pause, 1 );
	assert.equal( toggle.textContent, 'Play' );
	assert.equal( toggle.getAttribute( 'aria-label' ), 'Play slideshow' );

	toggle.click();
	assert.equal( page.calls.play, 1 );
	assert.equal( toggle.textContent, 'Pause' );
	assert.equal( toggle.getAttribute( 'aria-label' ), 'Pause slideshow' );

	page.root.appendChild( page.window.document.createElement( 'span' ) );
	await page.flush();
	assert.equal( page.root.querySelectorAll( '.sdse-slider-toggle' ).length, 1 );

} );

test( 'does not render a fake Pause/Play control for an unsupported slider', async () => {
	const page = await createPage( { supported: false } );

	assert.equal( page.root.querySelector( '.sdse-slider-toggle' ), null );
	assert.equal( page.root.querySelector( '.slider-prev' ).getAttribute( 'role' ), 'button' );
	assert.equal( page.root.querySelector( '.slider-prev' ).getAttribute( 'aria-label' ), 'Previous slide' );
	assert.equal( page.root.querySelector( '.slider-prev button' ), null );
	assert.equal( page.root.querySelector( '.slider-next' ).getAttribute( 'aria-label' ), 'Next slide' );
	assert.equal( page.root.querySelector( 'article' ).hasAttribute( 'inert' ), false );
	assert.equal( page.root.querySelector( 'article a' ).hasAttribute( 'tabindex' ), false );

} );

test( 'starts a supported autoplay slider paused when reduced motion is requested', async () => {
	const page = await createPage( { reducedMotion: true } );
	const toggle = page.root.querySelector( '.sdse-slider-toggle' );

	assert.equal( page.calls.pause, 1 );
	assert.equal( toggle.textContent, 'Play' );

} );

test( 'pauses on hover and does not resume after a persistent pause', async () => {
	const page = await createPage();
	const toggle = page.root.querySelector( '.sdse-slider-toggle' );

	page.root.dispatchEvent( new page.window.Event( 'mouseenter' ) );
	assert.equal( page.calls.pause, 1 );
	assert.equal( toggle.textContent, 'Pause' );

	page.root.dispatchEvent( new page.window.Event( 'mouseleave' ) );
	assert.equal( page.calls.play, 1 );

	toggle.click();
	assert.equal( page.calls.pause, 2 );
	assert.equal( toggle.textContent, 'Play' );

	page.root.dispatchEvent( new page.window.Event( 'mouseenter' ) );
	page.root.dispatchEvent( new page.window.Event( 'mouseleave' ) );
	assert.equal( page.calls.play, 1 );
} );

test( 'pauses while focus is inside and resumes only after focus leaves', async () => {
	const page = await createPage();
	const previous = page.root.querySelector( '.slider-prev' );
	const next = page.root.querySelector( '.slider-next' );
	const toggle = page.root.querySelector( '.sdse-slider-toggle' );
	const outside = page.window.document.createElement( 'button' );

	page.window.document.body.appendChild( outside );
	previous.focus();
	assert.equal( page.calls.pause, 1 );
	assert.equal( page.calls.play, 0 );

	next.focus();
	assert.equal( page.calls.pause, 1 );
	assert.equal( page.calls.play, 0 );

	outside.focus();
	assert.equal( page.calls.play, 1 );

	next.focus();
	assert.equal( page.calls.pause, 2 );
	toggle.click();
	assert.equal( page.calls.pause, 3 );
	toggle.click();
	assert.equal( page.calls.play, 1 );

	outside.focus();
	assert.equal( page.calls.play, 2 );
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
					<div class="swiper-slide swiper-slide-active"><a href="/first">First post</a></div>
					<div class="swiper-slide"><a href="/second" tabindex="2">Second post</a></div>
					<div class="swiper-slide swiper-slide-duplicate"><a href="/duplicate">Duplicate post</a></div>
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
	const slides = root.querySelectorAll( '.swiper-slide' );
	const firstLink = root.querySelector( 'a[href="/first"]' );
	const secondLink = root.querySelector( 'a[href="/second"]' );
	const duplicateLink = root.querySelector( 'a[href="/duplicate"]' );
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
			pause: 'Pause',
			pauseLabel: 'Pause slideshow',
			paused: 'Slideshow paused.',
			play: 'Play',
			playLabel: 'Play slideshow',
			playing: 'Slideshow playing.',
			previous: 'Previous slide',
			resumeAfterInteraction: 'Resume after focus and hover.',
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
	const previousButton = root.querySelector( '.swiper-button-prev' );
	const nextButton = root.querySelector( '.swiper-button-next' );
	assert.equal( root.getAttribute( 'aria-label' ), 'Featured content slider' );
	assert.equal( previousButton.getAttribute( 'role' ), 'button' );
	assert.equal( nextButton.getAttribute( 'role' ), 'button' );
	assert.equal( previousButton.getAttribute( 'aria-label' ), 'Previous slide' );
	assert.equal( nextButton.getAttribute( 'aria-label' ), 'Next slide' );
	assert.equal( root.querySelector( '.sdse-direction-button' ), null );
	assert.equal( toggle.textContent, 'Pause' );
	assert.equal( toggle.getAttribute( 'aria-label' ), 'Pause slideshow' );
	assert.equal( root.swiper.params.autoplay.delay, 7000 );
	assert.equal( calls.stop, 1 );
	assert.equal( calls.start, 1 );
	assert.equal( slides[ 0 ].hasAttribute( 'inert' ), false );
	assert.equal( firstLink.hasAttribute( 'tabindex' ), false );
	assert.equal( slides[ 1 ].hasAttribute( 'inert' ), true );
	assert.equal( secondLink.getAttribute( 'tabindex' ), '-1' );
	assert.equal( slides[ 2 ].hasAttribute( 'inert' ), true );
	assert.equal( duplicateLink.getAttribute( 'tabindex' ), '-1' );

	const delayedLink = window.document.createElement( 'a' );
	delayedLink.href = '/delayed';
	delayedLink.textContent = 'Delayed link';
	slides[ 1 ].appendChild( delayedLink );
	await new Promise( ( resolve ) => nativeSetTimeout( resolve, 50 ) );
	assert.equal( delayedLink.getAttribute( 'tabindex' ), '-1' );

	slides[ 0 ].classList.remove( 'swiper-slide-active' );
	slides[ 1 ].classList.add( 'swiper-slide-active' );
	await new Promise( ( resolve ) => nativeSetTimeout( resolve, 50 ) );

	assert.equal( slides[ 0 ].hasAttribute( 'inert' ), true );
	assert.equal( firstLink.getAttribute( 'tabindex' ), '-1' );
	assert.equal( slides[ 1 ].hasAttribute( 'inert' ), false );
	assert.equal( secondLink.getAttribute( 'tabindex' ), '2' );
	assert.equal( delayedLink.hasAttribute( 'tabindex' ), false );
	assert.equal( slides[ 2 ].hasAttribute( 'inert' ), true );
	assert.equal( duplicateLink.getAttribute( 'tabindex' ), '-1' );

	toggle.click();
	assert.equal( calls.stop, 2 );
	assert.equal( calls.pause, 0 );
	assert.equal( toggle.textContent, 'Play' );
	assert.equal( toggle.getAttribute( 'aria-label' ), 'Play slideshow' );

	toggle.click();
	assert.equal( calls.start, 2 );
	assert.equal( toggle.textContent, 'Pause' );
	assert.equal( toggle.getAttribute( 'aria-label' ), 'Pause slideshow' );
} );
