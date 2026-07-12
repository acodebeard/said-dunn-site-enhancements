( function () {
	'use strict';

	var settings = window.SDSESliderControls || {};
	var labels = settings.labels || {};
	var slideDelay = parseInt( settings.slideDelay, 10 );
	var initializedRoots = new WeakMap();
	var failedRoots = new WeakSet();
	var focusManagedRoots = new WeakSet();
	var rootId = 0;
	var scanScheduled = false;

	if ( ! slideDelay || slideDelay < 1000 ) {
		slideDelay = 7000;
	}

	var rootSelector = [
		'[data-featured-slider]',
		'[data-featured-carousel]',
		'#featured-slider',
		'#featured-content',
		'.featured-slider',
		'.featured-post-slider',
		'.featured-posts-slider',
		'.featured-content',
		'.featured-carousel',
		'.homemain'
	].join( ',' );

	var previousSelector = [
		'[data-slide="prev"]',
		'[data-slide="previous"]',
		'.slider-prev',
		'.slider-previous',
		'.flex-prev',
		'.slick-prev',
		'.swiper-button-prev',
		'.splide__arrow--prev',
		'.owl-prev'
	].join( ',' );

	var nextSelector = [
		'[data-slide="next"]',
		'.slider-next',
		'.flex-next',
		'.slick-next',
		'.swiper-button-next',
		'.splide__arrow--next',
		'.owl-next'
	].join( ',' );

	var slideSelector = [
		'.featured-content-inner > article',
		'.slides > li',
		'.slick-slide:not(.slick-cloned)',
		'.swiper-slide',
		'.splide__slide:not(.is-clone)',
		'.owl-item:not(.cloned)',
		'[data-slide-index]'
	].join( ',' );

	var focusSlideSelector = [
		'.featured-content-inner > article',
		'.slides > li',
		'.slick-slide',
		'.swiper-slide',
		'.splide__slide',
		'.owl-item',
		'[data-slide-index]'
	].join( ',' );

	var activeSlideSelector = [
		'.swiper-slide-active',
		'.slick-current',
		'.flex-active-slide',
		'.splide__slide.is-active',
		'.owl-item.active',
		'[aria-current="true"]',
		'[aria-current="slide"]',
		'[aria-hidden="false"]'
	].join( ',' );

	var focusableSelector = [
		'a[href]',
		'area[href]',
		'button:not([disabled])',
		'input:not([disabled]):not([type="hidden"])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'iframe',
		'object',
		'embed',
		'[contenteditable="true"]',
		'[tabindex]'
	].join( ',' );

	/**
	 * Returns the focusable elements in a slide, including the slide itself.
	 *
	 * @param {Element} slide Slide element.
	 * @return {Element[]} Focusable elements.
	 */
	function getFocusableElements( slide ) {
		var elements = Array.from( slide.querySelectorAll( focusableSelector ) );

		if ( slide.matches( focusableSelector ) ) {
			elements.unshift( slide );
		}

		return elements;
	}

	/**
	 * Removes one slide from the tab order without losing theme tabindex values.
	 *
	 * @param {Element} slide Inactive slide.
	 */
	function disableSlideFocus( slide ) {
		if ( ! slide.hasAttribute( 'inert' ) ) {
			slide.setAttribute( 'inert', '' );
			slide.dataset.sdseManagedInert = 'true';
		}

		getFocusableElements( slide ).forEach( function ( element ) {
			if ( 'true' !== element.dataset.sdseTabindexManaged ) {
				if ( element.hasAttribute( 'tabindex' ) ) {
					element.dataset.sdseOriginalTabindex = element.getAttribute( 'tabindex' );
				}

				element.dataset.sdseTabindexManaged = 'true';
			}

			element.setAttribute( 'tabindex', '-1' );
		} );
	}

	/**
	 * Restores focus behavior previously changed by this module.
	 *
	 * @param {Element} slide Current slide.
	 */
	function restoreSlideFocus( slide ) {
		if ( 'true' === slide.dataset.sdseManagedInert ) {
			slide.removeAttribute( 'inert' );
			delete slide.dataset.sdseManagedInert;
		}

		slide.querySelectorAll( '[data-sdse-tabindex-managed="true"]' ).forEach( function ( element ) {
			if ( element.hasAttribute( 'data-sdse-original-tabindex' ) ) {
				element.setAttribute( 'tabindex', element.dataset.sdseOriginalTabindex );
				delete element.dataset.sdseOriginalTabindex;
			} else {
				element.removeAttribute( 'tabindex' );
			}

			delete element.dataset.sdseTabindexManaged;
		} );

		if ( slide.matches( '[data-sdse-tabindex-managed="true"]' ) ) {
			if ( slide.hasAttribute( 'data-sdse-original-tabindex' ) ) {
				slide.setAttribute( 'tabindex', slide.dataset.sdseOriginalTabindex );
				delete slide.dataset.sdseOriginalTabindex;
			} else {
				slide.removeAttribute( 'tabindex' );
			}

			delete slide.dataset.sdseTabindexManaged;
		}
	}

	/**
	 * Keeps only the explicitly current slide in the keyboard tab order.
	 *
	 * If the theme exposes no current-slide state, all slides remain available.
	 *
	 * @param {Element} root Slider root.
	 */
	function updateSlideFocusOrder( root ) {
		var slides = Array.from( root.querySelectorAll( focusSlideSelector ) );
		var activeSlides = slides.filter( function ( slide ) {
			return slide.matches( activeSlideSelector );
		} );

		if ( 0 === activeSlides.length ) {
			slides.forEach( restoreSlideFocus );
			return;
		}

		slides.forEach( function ( slide ) {
			if ( activeSlides.includes( slide ) ) {
				restoreSlideFocus( slide );
			} else {
				disableSlideFocus( slide );
			}
		} );
	}

	/**
	 * Watches one slider for current-slide changes.
	 *
	 * @param {Element} root Slider root.
	 */
	function addSlideFocusManagement( root ) {
		if ( focusManagedRoots.has( root ) ) {
			return;
		}

		focusManagedRoots.add( root );
		updateSlideFocusOrder( root );

		if ( 'MutationObserver' in window ) {
			var focusObserver = new MutationObserver( function () {
				updateSlideFocusOrder( root );
			} );

			focusObserver.observe( root, {
				attributeFilter: [ 'aria-current', 'aria-hidden', 'class' ],
				attributes: true,
				childList: true,
				subtree: true
			} );
		}
	}

	/**
	 * Returns a localized label with a safe English fallback.
	 *
	 * @param {string} key      Label key.
	 * @param {string} fallback English fallback.
	 * @return {string} Label text.
	 */
	function getLabel( key, fallback ) {
		return typeof labels[ key ] === 'string' && labels[ key ] ? labels[ key ] : fallback;
	}

	/**
	 * Assigns an ID without replacing one supplied by the theme.
	 *
	 * @param {Element} root Slider root.
	 * @return {string} Root ID.
	 */
	function ensureRootId( root ) {
		if ( root.id ) {
			return root.id;
		}

		rootId += 1;
		root.id = 'sdse-featured-slider-' + rootId;

		return root.id;
	}

	/**
	 * Checks for a usable accessible name without replacing theme wording.
	 *
	 * @param {Element} control Control element.
	 * @return {boolean} Whether a name already exists.
	 */
	function hasAccessibleName( control ) {
		var image = control.querySelector( 'img[alt]' );
		var visibleText = control.textContent.trim();
		var meaningfulText = visibleText && /[\p{L}\p{N}]/u.test( visibleText );

		return Boolean(
			control.getAttribute( 'aria-label' ) ||
			control.getAttribute( 'aria-labelledby' ) ||
			control.getAttribute( 'title' ) ||
			meaningfulText ||
			( image && image.getAttribute( 'alt' ) )
		);
	}

	/**
	 * Checks whether an element already has native keyboard behavior.
	 *
	 * @param {Element} control Control element.
	 * @return {boolean} Whether the browser provides activation behavior.
	 */
	function isNativeControl( control ) {
		var tagName = control.tagName.toLowerCase();

		return 'button' === tagName ||
			'input' === tagName ||
			( 'a' === tagName && control.hasAttribute( 'href' ) );
	}

	/**
	 * Returns a native interactive element for one direction control.
	 *
	 * Theme-owned outer elements remain in place so their click handlers keep
	 * working. Clicks from an inserted button bubble to the original element.
	 *
	 * @param {Element} control Existing direction control.
	 * @return {Element} Native control to enhance.
	 */
	function getNativeDirectionControl( control ) {
		if ( isNativeControl( control ) ) {
			return control;
		}

		var existingButton = control.querySelector( ':scope > .sdse-direction-button' );
		if ( existingButton ) {
			return existingButton;
		}

		var nestedControls = control.querySelectorAll( 'button, input, a[href]' );
		for ( var index = 0; index < nestedControls.length; index += 1 ) {
			if ( isNativeControl( nestedControls[ index ] ) ) {
				return nestedControls[ index ];
			}
		}

		var button = document.createElement( 'button' );
		button.className = 'sdse-direction-button';
		button.type = 'button';

		while ( control.firstChild ) {
			button.appendChild( control.firstChild );
		}

		control.appendChild( button );
		if ( 'button' === control.getAttribute( 'role' ) ) {
			control.removeAttribute( 'role' );
		}
		control.removeAttribute( 'tabindex' );

		return button;
	}

	/**
	 * Improves one existing direction control without altering its behavior.
	 *
	 * @param {Element} control  Existing control.
	 * @param {string}  label    Accessible name.
	 * @param {string}  controls Slider root ID.
	 */
	function enhanceDirectionControl( control, label, controls ) {
		var nativeControl = getNativeDirectionControl( control );

		if ( 'button' === nativeControl.tagName.toLowerCase() && ! nativeControl.hasAttribute( 'type' ) ) {
			nativeControl.setAttribute( 'type', 'button' );
		}

		if ( ! hasAccessibleName( nativeControl ) ) {
			if ( nativeControl !== control && control.getAttribute( 'aria-label' ) ) {
				nativeControl.setAttribute( 'aria-label', control.getAttribute( 'aria-label' ) );
			} else if ( nativeControl !== control && control.getAttribute( 'aria-labelledby' ) ) {
				nativeControl.setAttribute( 'aria-labelledby', control.getAttribute( 'aria-labelledby' ) );
			} else {
				nativeControl.setAttribute( 'aria-label', label );
			}
		}

		if ( ! nativeControl.hasAttribute( 'aria-controls' ) ) {
			nativeControl.setAttribute(
				'aria-controls',
				control.getAttribute( 'aria-controls' ) || controls
			);
		}
	}

	/**
	 * Finds all controls matching a direction and enhances them.
	 *
	 * @param {Element} root     Slider root.
	 * @param {string}  selector Direction selector.
	 * @param {string}  label    Accessible name.
	 * @param {string}  controls Slider root ID.
	 * @return {number} Number of controls found.
	 */
	function enhanceDirection( root, selector, label, controls ) {
		var directionControls = root.querySelectorAll( selector );

		directionControls.forEach( function ( control ) {
			enhanceDirectionControl( control, label, controls );
		} );

		return directionControls.length;
	}

	/**
	 * Builds an adapter for an object with real pause and play methods.
	 *
	 * @param {Object} instance Slider instance.
	 * @return {Object|null} Normalized adapter or null.
	 */
	function methodAdapter( instance ) {
		var autoplayDisabled = instance.vars && false === instance.vars.slideshow;

		autoplayDisabled = autoplayDisabled || ( instance.options && false === instance.options.autoplay );

		if ( autoplayDisabled || 'function' !== typeof instance.pause || 'function' !== typeof instance.play ) {
			return null;
		}

		return {
			pause: function () {
				instance.pause();
			},
			play: function () {
				instance.play();
			},
			isPlaying: function () {
				if ( 'boolean' === typeof instance.playing ) {
					return instance.playing;
				}

				return null;
			}
		};
	}

	/**
	 * Finds a slider API stored by a jQuery-based classic theme.
	 *
	 * @param {Element} root Slider root.
	 * @return {Object|null} Normalized adapter or null.
	 */
	function jQueryAdapter( root ) {
		var jQuery = window.jQuery;
		var engineSelector = '.flexslider, .slick-slider, .owl-carousel, [data-cycle-slides]';
		var engines = [ root ];

		if ( 'function' !== typeof jQuery ) {
			return null;
		}

		root.querySelectorAll( engineSelector ).forEach( function ( engine ) {
			engines.push( engine );
		} );

		for ( var index = 0; index < engines.length; index += 1 ) {
			var engine = engines[ index ];
			var $engine = jQuery( engine );
			var data = $engine.data() || {};
			var dataKeys = Object.keys( data );

			if ( $engine.hasClass( 'slick-initialized' ) && 'function' === typeof $engine.slick ) {
				try {
					var slick = $engine.slick( 'getSlick' );

					if ( slick && slick.options && false !== slick.options.autoplay ) {
						return {
							pause: function () {
								$engine.slick( 'slickPause' );
							},
							play: function () {
								$engine.slick( 'slickPlay' );
							},
							isPlaying: function () {
								return ! slick.paused;
							}
						};
					}
				} catch ( error ) {
					// Continue looking; no control is added for a broken API.
				}
			}

			for ( var keyIndex = 0; keyIndex < dataKeys.length; keyIndex += 1 ) {
				var key = dataKeys[ keyIndex ];

				if ( ! /slider|carousel|slideshow/i.test( key ) || ! data[ key ] ) {
					continue;
				}

				var adapter = methodAdapter( data[ key ] );
				if ( adapter ) {
					return adapter;
				}
			}
		}

		return null;
	}

	/**
	 * Finds a supported non-jQuery slider API.
	 *
	 * @param {Element} root Slider root.
	 * @return {Object|null} Normalized adapter or null.
	 */
	function nativeAdapter( root ) {
		var engines = [ root ];

		root.querySelectorAll( '.swiper, .swiper-container, .splide' ).forEach( function ( engine ) {
			engines.push( engine );
		} );

		for ( var index = 0; index < engines.length; index += 1 ) {
			var engine = engines[ index ];
			var swiper = engine.swiper;

			if ( swiper && swiper.autoplay ) {
				var autoplayOptions = swiper.params && swiper.params.autoplay;
				var autoplayEnabled = false !== autoplayOptions && false !== ( autoplayOptions && autoplayOptions.enabled );
				var canPauseResume = 'function' === typeof swiper.autoplay.pause && 'function' === typeof swiper.autoplay.resume;
				var canStopStart = 'function' === typeof swiper.autoplay.stop && 'function' === typeof swiper.autoplay.start;
				var delayChanged = autoplayOptions && 'object' === typeof autoplayOptions && autoplayOptions.delay !== slideDelay;

				if ( autoplayOptions && 'object' === typeof autoplayOptions ) {
					autoplayOptions.delay = slideDelay;
				}

				if ( swiper.originalParams && swiper.originalParams.autoplay && 'object' === typeof swiper.originalParams.autoplay ) {
					swiper.originalParams.autoplay.delay = slideDelay;
				}

				if ( delayChanged && canStopStart && swiper.autoplay.running && ! swiper.autoplay.paused ) {
					swiper.autoplay.stop();
					swiper.autoplay.start();
				}

				if ( autoplayEnabled && ( canPauseResume || canStopStart ) ) {
					return {
						pause: function () {
							if ( canPauseResume ) {
								swiper.autoplay.pause();
							} else {
								swiper.autoplay.stop();
							}
						},
						play: function () {
							if ( canPauseResume ) {
								swiper.autoplay.resume();
							} else {
								swiper.autoplay.start();
							}
						},
						isPlaying: function () {
							return Boolean( swiper.autoplay.running && ! swiper.autoplay.paused );
						}
					};
				}
			}

			if ( engine.splide && engine.splide.Components && engine.splide.Components.Autoplay ) {
				var splideAutoplay = engine.splide.Components.Autoplay;
				var splideOptions = engine.splide.options || {};

				if ( false !== splideOptions.autoplay && 'function' === typeof splideAutoplay.pause && 'function' === typeof splideAutoplay.play ) {
					return {
						pause: function () {
							splideAutoplay.pause();
						},
						play: function () {
							splideAutoplay.play();
						},
						isPlaying: function () {
							return null;
						}
					};
				}
			}
		}

		return null;
	}

	/**
	 * Returns the first real API the featured slider exposes.
	 *
	 * @param {Element} root Slider root.
	 * @return {Object|null} Normalized adapter or null.
	 */
	function findAdapter( root ) {
		return nativeAdapter( root ) || jQueryAdapter( root );
	}

	/**
	 * Updates the toggle's visible and accessible state.
	 *
	 * @param {Object} state Module state for one slider.
	 */
	function updateToggle( state ) {
		state.button.textContent = state.paused ?
			getLabel( 'play', 'Play' ) :
			getLabel( 'pause', 'Pause' );
		state.button.setAttribute(
			'aria-label',
			state.paused ?
				getLabel( 'playLabel', 'Play slideshow' ) :
				getLabel( 'pauseLabel', 'Pause slideshow' )
		);
	}

	/**
	 * Removes a control if its underlying slider API fails.
	 *
	 * @param {Object} state Module state for one slider.
	 */
	function removeFailedControl( state ) {
		state.wrapper.remove();
		initializedRoots.delete( state.root );
		failedRoots.add( state.root );
	}

	/**
	 * Pauses or plays through the slider's API and then updates the UI.
	 *
	 * @param {Object}  state    Module state for one slider.
	 * @param {boolean} paused   Desired state.
	 * @param {string}  message  Optional live-region message.
	 * @return {boolean} Whether the API call succeeded.
	 */
	function setPaused( state, paused, message ) {
		try {
			if ( paused ) {
				state.adapter.pause();
			} else if ( state.hovered || state.focused ) {
				state.interactionPaused = true;
				message = getLabel(
					'resumeAfterInteraction',
					'Slideshow will resume when focus and the pointer leave.'
				);
			} else {
				state.adapter.play();
			}
		} catch ( error ) {
			removeFailedControl( state );
			return false;
		}

		state.paused = paused;
		updateToggle( state );

		if ( message ) {
			state.status.textContent = '';
			window.setTimeout( function () {
				state.status.textContent = message;
			}, 20 );
		}

		return true;
	}

	/**
	 * Temporarily pauses autoplay while a pointer or keyboard focus is inside.
	 *
	 * A manual or reduced-motion pause remains in force after focus and the
	 * pointer leave.
	 *
	 * @param {Object} state Module state for one slider.
	 */
	function addInteractionPauseBehavior( state ) {
		var pauseForInteraction = function () {
			if ( state.paused || state.interactionPaused ) {
				return;
			}

			try {
				state.adapter.pause();
				state.interactionPaused = true;
			} catch ( error ) {
				removeFailedControl( state );
			}
		};

		var resumeAfterInteraction = function () {
			if ( state.hovered || state.focused || ! state.interactionPaused ) {
				return;
			}

			state.interactionPaused = false;

			if ( state.paused ) {
				return;
			}

			try {
				state.adapter.play();
			} catch ( error ) {
				removeFailedControl( state );
			}
		};

		state.root.addEventListener( 'mouseenter', function () {
			state.hovered = true;
			pauseForInteraction();
		} );
		state.root.addEventListener( 'mouseleave', function () {
			state.hovered = false;
			resumeAfterInteraction();
		} );
		state.root.addEventListener( 'focusin', function () {
			state.focused = true;
			pauseForInteraction();
		} );
		state.root.addEventListener( 'focusout', function ( event ) {
			if ( event.relatedTarget && state.root.contains( event.relatedTarget ) ) {
				return;
			}

			state.focused = false;
			resumeAfterInteraction();
		} );

		if ( state.root.matches( ':hover' ) ) {
			state.hovered = true;
			pauseForInteraction();
		}

		if ( state.root.contains( document.activeElement ) ) {
			state.focused = true;
			pauseForInteraction();
		}
	}

	/**
	 * Adds a Pause/Play control backed by a verified slider API.
	 *
	 * @param {Element} root      Slider root.
	 * @param {Object}  adapter   Normalized slider API.
	 * @param {string}  controls  Slider root ID.
	 */
	function addPauseControl( root, adapter, controls ) {
		var wrapper = document.createElement( 'div' );
		var button = document.createElement( 'button' );
		var status = document.createElement( 'span' );
		var currentPlaying = adapter.isPlaying();
		var state = {
			adapter: adapter,
			button: button,
			focused: false,
			hovered: false,
			interactionPaused: false,
			paused: false === currentPlaying,
			root: root,
			status: status,
			wrapper: wrapper
		};

		wrapper.className = 'sdse-slider-controls';
		button.className = 'sdse-slider-toggle';
		button.type = 'button';
		button.setAttribute( 'aria-controls', controls );

		status.className = 'sdse-screen-reader-text';
		status.setAttribute( 'aria-live', 'polite' );
		status.setAttribute( 'aria-atomic', 'true' );

		wrapper.appendChild( button );
		wrapper.appendChild( status );
		root.appendChild( wrapper );
		initializedRoots.set( root, state );
		updateToggle( state );

		button.addEventListener( 'click', function () {
			var shouldPause = ! state.paused;
			var message = shouldPause ?
				getLabel( 'paused', 'Slideshow paused.' ) :
				getLabel( 'playing', 'Slideshow playing.' );

			setPaused( state, shouldPause, message );
		} );

		addInteractionPauseBehavior( state );

		if ( window.matchMedia ) {
			var reducedMotion = window.matchMedia( '(prefers-reduced-motion: reduce)' );
			var pauseForReducedMotion = function ( event ) {
				if ( event.matches && ! state.paused ) {
					setPaused(
						state,
						true,
						getLabel( 'reducedMotionPause', 'Slideshow paused because reduced motion is enabled.' )
					);
				}
			};

			pauseForReducedMotion( reducedMotion );
			if ( failedRoots.has( root ) ) {
				return;
			}

			if ( 'function' === typeof reducedMotion.addEventListener ) {
				reducedMotion.addEventListener( 'change', pauseForReducedMotion );
			} else if ( 'function' === typeof reducedMotion.addListener ) {
				reducedMotion.addListener( pauseForReducedMotion );
			}
		}
	}

	/**
	 * Enhances one conservative featured-slider candidate.
	 *
	 * @param {Element} root Slider root.
	 */
	function initializeRoot( root ) {
		var slideCount = root.querySelectorAll( slideSelector ).length;
		var previousCount = root.querySelectorAll( previousSelector ).length;
		var nextCount = root.querySelectorAll( nextSelector ).length;

		if ( slideCount < 2 && ( 0 === previousCount || 0 === nextCount ) ) {
			return;
		}

		var controls = ensureRootId( root );

		if ( ! root.hasAttribute( 'role' ) ) {
			root.setAttribute( 'role', 'region' );
		}

		if ( ! root.hasAttribute( 'aria-label' ) && ! root.hasAttribute( 'aria-labelledby' ) ) {
			root.setAttribute( 'aria-label', getLabel( 'region', 'Featured content slider' ) );
		}

		if ( ! root.hasAttribute( 'aria-roledescription' ) ) {
			root.setAttribute( 'aria-roledescription', getLabel( 'carousel', 'carousel' ) );
		}

		enhanceDirection( root, previousSelector, getLabel( 'previous', 'Previous slide' ), controls );
		enhanceDirection( root, nextSelector, getLabel( 'next', 'Next slide' ), controls );
		addSlideFocusManagement( root );

		if ( initializedRoots.has( root ) || failedRoots.has( root ) ) {
			return;
		}

		var adapter = findAdapter( root );
		if ( adapter ) {
			addPauseControl( root, adapter, controls );
		}
	}

	/**
	 * Scans the document for the deliberately narrow featured-slider markers.
	 */
	function scan() {
		document.querySelectorAll( rootSelector ).forEach( initializeRoot );
	}

	/**
	 * Coalesces DOM changes into at most one scan per animation frame.
	 */
	function scheduleScan() {
		if ( scanScheduled ) {
			return;
		}

		scanScheduled = true;
		window.requestAnimationFrame( function () {
			scanScheduled = false;
			scan();
		} );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', scan );
	} else {
		scan();
	}

	window.addEventListener( 'load', function () {
		scan();
		window.setTimeout( scan, 250 );
		window.setTimeout( scan, 1000 );
		window.setTimeout( scan, 3000 );
	} );

	if ( 'MutationObserver' in window ) {
		var observer = new MutationObserver( scheduleScan );
		var observe = function () {
			if ( document.body ) {
				observer.observe( document.body, { childList: true, subtree: true } );
			}
		};

		if ( document.body ) {
			observe();
		} else {
			document.addEventListener( 'DOMContentLoaded', observe );
		}
	}
}() );
