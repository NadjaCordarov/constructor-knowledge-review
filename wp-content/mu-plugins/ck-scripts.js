/**
 * Constructor Knowledge — the single JavaScript surface for this project
 * (CLAUDE.md rule 5). All JS lives in this one file, sectioned and inventoried.
 *
 * -----------------------------------------------------------------------------
 * INDEX
 * -----------------------------------------------------------------------------
 *
 *   JS1 · Listing interaction — [ck_programs] / [ck_news] / [ck_entities]
 *   JS2 · Partner marquee — autoplay by scrollLeft, plus mouse drag
 *
 * Every section carries a TRIED / WHY / SCOPE / DATE banner, appears in the
 * index above, and is mirrored as a row in PLAN.md -> Custom code inventory.
 * If it is not in the inventory it must not exist; deleting a section deletes
 * its inventory row in the same commit. Section numbers are never reused.
 *
 * -----------------------------------------------------------------------------
 * Why this file exists at all, and what it is not allowed to become
 * -----------------------------------------------------------------------------
 * Until 2026-08-24 this file deliberately did not exist. PLAN.md said so in as
 * many words — "ck-scripts.js is deliberately not enqueued and does not exist
 * on disk: the whole design needs zero JS" — and ISSUE-048 was resolved without
 * reaching for it, on the grounds that a no-script defect cannot honestly be
 * fixed with script.
 *
 * ISSUE-030 named the change that would create it, and this is that change: the
 * ecosystem explorer's row -> panel swap, and the same argument for the two
 * filtered listings. All three are interactions the design itself implements in
 * JavaScript. Nothing here makes content appear that was not already in the
 * HTML — every program, story, entity row and entity panel is rendered
 * server-side by ck-core.php SS6, and this file only hides the ones a filter
 * excludes. With script unavailable a visitor sees more than the design shows,
 * never less.
 *
 * -----------------------------------------------------------------------------
 * This file contains no design value and no copy. That is a rule, not a habit
 * -----------------------------------------------------------------------------
 * Every colour, every grid template, every breakpoint and every string arrives
 * from a data attribute that ck-core.php SS6 emitted. There is not one hex, one
 * pixel value or one word of visible text below. So a colour change is a PHP
 * change, a copy change is a shortcode attribute, and neither is ever a reason
 * to open this file. If a future edit is about to type a `#` or a user-visible
 * string here, the value belongs in SS6 and the attribute belongs in the
 * markup.
 */

/* ==========================================================================
 * JS1 · LISTING INTERACTION — facet filtering and the entity explorer
 * TRIED : Elementor -> Add Widget -> Loop Grid / Posts (Pro-only, absent from
 *         the free widget list, and none of the three filters a result set);
 *         Elementor -> Add Widget -> Nested Tabs for the explorer swap (free,
 *         present, priced and rejected in ISSUE-026 — its panels are authored
 *         containers, so the entity copy leaves wp-admin).
 * WHY   : the three data-driven listings are stateful. Free Elementor has no
 *         control that filters a grid and none that swaps a rich panel from a
 *         list of eight triggers, at any nesting depth. ISSUE-001 (resolved
 *         2026-08-17, widened 2026-08-21), ISSUE-026 / ISSUE-030.
 * SCOPE : front end, only where SS6's shortcodes are on the page — the
 *         Programs, News and Ecosystem pages. Every entry point is a
 *         data-attribute query, so a page without the markup runs three
 *         querySelectorAll calls and stops.
 * DATE  : 2026-08-24 - wp-platform; the news pager added 2026-08-26
 *
 * THE NEWS PAGER (2026-08-26). Elementor free has no pagination control of any
 * kind, and the one WordPress offers is server-side — which here would mean a
 * reload on every chip click and the loss of the filter state the design has no
 * reload for. So the pager is client-side, over the same already-rendered card
 * set the filters work on: nothing new is fetched and nothing new is hidden
 * from a visitor without script, who still sees all fourteen stories. Every
 * colour, every string and the page size itself come from SS6's attributes.
 *
 * The explorer's column collapse) is in here rather than in a stylesheet
 * because that is where the design puts it: `Constructor Knowledge.dc.html`
 * L981 sets `ex.style.gridTemplateColumns` on resize. The threshold is D-40's
 * 1000px rather than the design's 900px and it arrives as a data attribute.
 * ========================================================================== */

( function () {
	'use strict';

	/**
	 * Show or hide an element that SS6 marked with its shown display value.
	 *
	 * The `hidden` attribute is not usable here: SS6 styles every node inline,
	 * and an inline `display` beats the UA sheet's `[hidden] { display: none }`
	 * on specificity, so a hidden flex card would still be shown. The shown
	 * value therefore travels in `data-ck-display`.
	 */
	function toggle( el, on ) {
		el.style.display = on ? ( el.getAttribute( 'data-ck-display' ) || '' ) : 'none';
	}

	/** Membership test against SS6's pipe-delimited slug lists. */
	function has( attr, value ) {
		return ( attr || '' ).indexOf( '|' + value + '|' ) !== -1;
	}

	/** Repaint a two-state control from its own data-on-* / data-off-* pairs. */
	function paint( el, on, map ) {
		Object.keys( map ).forEach( function ( prop ) {
			var value = el.getAttribute( ( on ? 'data-on-' : 'data-off-' ) + map[ prop ] );

			if ( null !== value ) {
				el.style[ prop ] = value;
			}
		} );
	}

	/* ---------------------------------------------------------------------
	 * [ck_programs] — three facet groups, OR within a group, AND across them
	 * ------------------------------------------------------------------ */

	function initPrograms( root ) {
		var options = [].slice.call( root.querySelectorAll( '[data-ck-opt]' ) );
		var chips = [].slice.call( root.querySelectorAll( '[data-ck-chip]' ) );
		var cards = [].slice.call( root.querySelectorAll( '[data-ck-card]' ) );
		var heading = root.querySelector( '[data-ck-heading]' );
		var clear = root.querySelector( '[data-ck-clear]' );
		var empty = root.querySelector( '[data-ck-empty]' );
		var selected = {};

		function pick( facet ) {
			if ( ! selected[ facet ] ) {
				selected[ facet ] = [];
			}

			return selected[ facet ];
		}

		function toggleValue( facet, value ) {
			var list = pick( facet );
			var at = list.indexOf( value );

			if ( at === -1 ) {
				list.push( value );
			} else {
				list.splice( at, 1 );
			}
		}

		function isOn( facet, value ) {
			return pick( facet ).indexOf( value ) !== -1;
		}

		function render() {
			var active = 0;
			var shown = 0;

			options.forEach( function ( button ) {
				var on = isOn( button.getAttribute( 'data-ck-facet' ), button.getAttribute( 'data-ck-value' ) );

				button.setAttribute( 'aria-pressed', on ? 'true' : 'false' );
				paint( button, on, { background: 'bg', borderColor: 'bd' } );

				var label = button.querySelector( '[data-ck-opt-label]' );
				var sub = button.querySelector( '[data-ck-opt-sub]' );

				if ( label ) {
					label.style.color = button.getAttribute( on ? 'data-on-fg' : 'data-off-fg' );
				}

				if ( sub ) {
					sub.style.color = button.getAttribute( on ? 'data-on-sub' : 'data-off-sub' );
				}
			} );

			chips.forEach( function ( chip ) {
				var on = isOn( chip.getAttribute( 'data-ck-facet' ), chip.getAttribute( 'data-ck-value' ) );

				toggle( chip, on );

				if ( on ) {
					active += 1;
				}
			} );

			cards.forEach( function ( card ) {
				var visible = Object.keys( selected ).every( function ( facet ) {
					var list = selected[ facet ];

					if ( ! list.length ) {
						return true;
					}

					var attr = card.getAttribute( 'data-' + facet );

					return list.some( function ( value ) {
						return has( attr, value );
					} );
				} );

				toggle( card, visible );

				if ( visible ) {
					shown += 1;
				}
			} );

			if ( heading ) {
				heading.textContent = shown
					? shown + heading.getAttribute( shown === 1 ? 'data-one' : 'data-many' )
					: heading.getAttribute( 'data-none' );
			}

			if ( clear ) {
				toggle( clear, active > 0 );
			}

			if ( empty ) {
				toggle( empty, shown === 0 );
			}
		}

		options.forEach( function ( button ) {
			button.addEventListener( 'click', function () {
				toggleValue( button.getAttribute( 'data-ck-facet' ), button.getAttribute( 'data-ck-value' ) );
				render();
			} );
		} );

		chips.forEach( function ( chip ) {
			chip.addEventListener( 'click', function () {
				toggleValue( chip.getAttribute( 'data-ck-facet' ), chip.getAttribute( 'data-ck-value' ) );
				render();
			} );
		} );

		if ( clear ) {
			clear.addEventListener( 'click', function () {
				selected = {};
				render();
			} );
		}

		render();
	}

	/* ---------------------------------------------------------------------
	 * [ck_news] — two single-select chip rows combining with AND. The first
	 * chip in each row is the no-filter sentinel and carries an empty value.
	 * ------------------------------------------------------------------ */

	function initNews( root ) {
		var chips = [].slice.call( root.querySelectorAll( '[data-ck-chip]' ) );
		var cards = [].slice.call( root.querySelectorAll( '[data-ck-card]' ) );
		var count = root.querySelector( '[data-ck-count]' );
		var empty = root.querySelector( '[data-ck-empty]' );
		var selected = {};

		/* Pagination, added 2026-08-26. The pager is optional: SS6 emits it
		 * only for view="list", so the home page's featured trio and the news
		 * page's pinned band run this function without one and every reference
		 * below is guarded. */
		var pager = root.querySelector( '[data-ck-pager]' );
		var pages = pager && pager.querySelector( '[data-ck-pages]' );
		var tpl = pager && pager.querySelector( '[data-ck-page-tpl]' );
		var prev = pager && pager.querySelector( '[data-ck-prev]' );
		var next = pager && pager.querySelector( '[data-ck-next]' );
		var perPage = pager ? parseInt( pager.getAttribute( 'data-ck-per-page' ), 10 ) : 0;
		var page = 1;

		/** A prev/next button that cannot go anywhere reads as unavailable. */
		function setEnabled( button, on ) {
			if ( ! button ) {
				return;
			}

			button.disabled = ! on;
			button.style.opacity = on ? '' : '0.4';
			button.style.cursor = on ? 'pointer' : 'default';
		}

		/* The page COUNT is a function of the live filter, so the number
		 * buttons are built here rather than server-side. The template button
		 * carries every style and both colour states; this only clones it and
		 * writes a number into it. No design value crosses into this file. */
		function renderPager( total ) {
			if ( ! pager ) {
				return;
			}

			var last = Math.max( 1, Math.ceil( total / perPage ) );

			toggle( pager, last > 1 );

			if ( pages ) {
				pages.textContent = '';

				for ( var n = 1; n <= last; n += 1 ) {
					( function ( number ) {
						var button = tpl.content.firstElementChild.cloneNode( true );

						button.textContent = number;
						paint( button, number === page, { color: 'fg', background: 'bg', borderColor: 'bd' } );
						button.setAttribute( 'aria-current', number === page ? 'true' : 'false' );
						button.addEventListener( 'click', function () {
							page = number;
							render();
						} );
						pages.appendChild( button );
					}( n ) );
				}
			}

			setEnabled( prev, page > 1 );
			setEnabled( next, page < last );
		}

		function render() {
			var matching = [];

			chips.forEach( function ( chip ) {
				var facet = chip.getAttribute( 'data-ck-facet' );
				var on = ( selected[ facet ] || '' ) === chip.getAttribute( 'data-ck-value' );

				chip.setAttribute( 'aria-pressed', on ? 'true' : 'false' );
				paint( chip, on, { color: 'fg', background: 'bg', borderColor: 'bd' } );
			} );

			cards.forEach( function ( card ) {
				var visible = Object.keys( selected ).every( function ( facet ) {
					return ! selected[ facet ] || has( card.getAttribute( 'data-' + facet ), selected[ facet ] );
				} );

				if ( visible ) {
					matching.push( card );
				} else {
					toggle( card, false );
				}
			} );

			var shown = matching.length;

			/* Clamp before slicing: a filter that shrinks the result set while
			 * the reader is on page 3 must not leave them on an empty page. */
			if ( pager ) {
				var last = Math.max( 1, Math.ceil( shown / perPage ) );

				page = Math.min( Math.max( 1, page ), last );
			}

			matching.forEach( function ( card, i ) {
				toggle( card, ! pager || ( i >= ( page - 1 ) * perPage && i < page * perPage ) );
			} );

			if ( count ) {
				/* The count is the size of the FILTERED set, not of the page.
				 * "14 stories" over a 9-card page is the honest number and it
				 * is what makes the pager legible. */
				count.textContent = shown + count.getAttribute( shown === 1 ? 'data-one' : 'data-many' );
			}

			/* The panel is only in the document when the user has supplied
			 * `news.list.empty` — see SS6. Without it the page renders the
			 * design as drawn, which is a blank area under `0 stories`. */
			if ( empty ) {
				toggle( empty, shown === 0 );
			}

			renderPager( shown );
		}

		chips.forEach( function ( chip ) {
			var facet = chip.getAttribute( 'data-ck-facet' );

			if ( ! ( facet in selected ) ) {
				selected[ facet ] = '';
			}

			chip.addEventListener( 'click', function () {
				selected[ facet ] = chip.getAttribute( 'data-ck-value' );
				/* A new filter is a new result set, so it starts at page 1. */
				page = 1;
				render();
			} );
		} );

		if ( prev ) {
			prev.addEventListener( 'click', function () {
				page -= 1;
				render();
			} );
		}

		if ( next ) {
			next.addEventListener( 'click', function () {
				page += 1;
				render();
			} );
		}

		render();
	}

	/* ---------------------------------------------------------------------
	 * [ck_entities] — row click swaps the panel; width drives the collapse
	 * ------------------------------------------------------------------ */

	function initExplorer( root ) {
		var rows = [].slice.call( root.querySelectorAll( '[data-ck-row]' ) );
		var panels = [].slice.call( root.querySelectorAll( '[data-ck-panel]' ) );
		var wide = root.getAttribute( 'data-ck-cols' );
		var narrow = root.getAttribute( 'data-ck-cols-narrow' );
		var at = parseInt( root.getAttribute( 'data-ck-collapse' ), 10 );

		function select( id ) {
			rows.forEach( function ( row ) {
				var on = row.getAttribute( 'data-ck-target' ) === id;

				row.setAttribute( 'aria-selected', on ? 'true' : 'false' );
				paint( row, on, { background: 'bg', borderLeftColor: 'bar' } );
			} );

			panels.forEach( function ( panel ) {
				toggle( panel, panel.id === id );
			} );
		}

		rows.forEach( function ( row ) {
			row.addEventListener( 'click', function () {
				select( row.getAttribute( 'data-ck-target' ) );
			} );
		} );

		/* Measured on the element's own box, not the viewport, so the explorer
		 * behaves the same inside a narrow container as it does on a narrow
		 * screen — which is what the design's `el.clientWidth` test does. */
		function fit() {
			root.style.gridTemplateColumns = root.clientWidth < at ? narrow : wide;
		}

		if ( wide && narrow && at ) {
			if ( window.ResizeObserver ) {
				new window.ResizeObserver( fit ).observe( root );
			} else {
				window.addEventListener( 'resize', fit );
			}

			fit();
		}
	}

	function start() {
		[].forEach.call( document.querySelectorAll( '[data-ck-programs]' ), initPrograms );
		[].forEach.call( document.querySelectorAll( '[data-ck-news]' ), initNews );
		[].forEach.call( document.querySelectorAll( '[data-ck-explorer]' ), initExplorer );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		start();
	}
}() );


/* ==========================================================================
 * JS2 · PARTNER MARQUEE — autoplay by scrollLeft, plus mouse drag
 * TRIED : Container -> Layout -> Overflow = Auto (used, and it is what makes
 *         this possible at all — the wrapper is a real scroll container, so
 *         touch swipe and trackpad already work with no JS) ; Image Carousel
 *         widget -> Additional Options (Swiper drags natively, but the widget
 *         exposes no per-slide background or box-shadow control, so the
 *         design's white 246px logo card cannot be built in it — the full
 *         argument is in ck-styles.css SS4).
 * WHY   : free Elementor has no continuous marquee and no pointer-drag on a
 *         scroll container. The old construction was a CSS keyframe transform,
 *         which by definition cannot be dragged; the user asked for mouse drag
 *         on 2026-08-26, so the movement moved to scrollLeft and this section
 *         is what steps it. This reinstates the prototype's own initMarqueeDrag
 *         (design L903-955, dropped as D-57).
 * SCOPE : front end, the home page only — one querySelectorAll on .ck-marquee,
 *         which matches nothing anywhere else.
 * DATE  : 2026-08-26 - wp-platform
 *
 * NO DESIGN VALUE LIVES HERE, same rule as JS1. The scroll rate is read from
 * `--ck-marquee-speed` on the element, which ck-styles.css SS4 sets to the
 * design's own 55px/s. There is not a number below that is not structural.
 *
 * THE LOOP IS THE DOUBLED TILE LIST. build/pages/home.php renders the 27
 * partners twice, so the track's content repeats at exactly half its width.
 * Wrapping scrollLeft on that half-width boundary is invisible, and because it
 * wraps in BOTH directions the strip is endless when dragged backwards too —
 * which the old transform version could not do at all.
 * ========================================================================== */

( function () {
	'use strict';

	function initMarquee( el ) {
		var track = el.querySelector( '.ck-marquee-track' );

		if ( ! track ) {
			return;
		}

		var reduce = window.matchMedia && window.matchMedia( '(prefers-reduced-motion: reduce)' ).matches;
		var speed = parseFloat( getComputedStyle( el ).getPropertyValue( '--ck-marquee-speed' ) ) || 0;
		var hovering = false;
		var dragging = false;
		var startX = 0;
		var startScroll = 0;
		var last = null;

		/** Half the track width — the copy boundary the doubled list creates. */
		function half() {
			return track.scrollWidth / 2;
		}

		/* Keep scrollLeft strictly inside one copy. Both branches land on
		 * pixel-identical content, so neither is visible. */
		function wrap() {
			var h = half();

			if ( h <= 0 ) {
				return;
			}

			if ( el.scrollLeft >= h ) {
				el.scrollLeft -= h;
			} else if ( el.scrollLeft <= 0 ) {
				el.scrollLeft += h;
			}
		}

		function step( now ) {
			if ( null === last ) {
				last = now;
			}

			var dt = ( now - last ) / 1000;
			last = now;

			/* dt is clamped because a backgrounded tab hands back one huge
			 * delta on return, which would jump the strip several copies. */
			if ( ! hovering && ! dragging && dt > 0 && dt < 0.1 ) {
				el.scrollLeft += speed * dt;
			}

			wrap();
			window.requestAnimationFrame( step );
		}

		el.addEventListener( 'pointerenter', function () {
			hovering = true;
		} );

		el.addEventListener( 'pointerleave', function () {
			hovering = false;
		} );

		/* Mouse only. Touch and pen already pan this element natively through
		 * Overflow = Auto, and hijacking them here would fight the platform's
		 * own momentum scrolling. */
		el.addEventListener( 'pointerdown', function ( e ) {
			if ( 'mouse' !== e.pointerType ) {
				return;
			}

			dragging = true;
			startX = e.clientX;
			startScroll = el.scrollLeft;
			el.classList.add( 'is-ck-dragging' );
			el.setPointerCapture( e.pointerId );
			e.preventDefault();
		} );

		el.addEventListener( 'pointermove', function ( e ) {
			if ( ! dragging ) {
				return;
			}

			el.scrollLeft = startScroll - ( e.clientX - startX );
			wrap();

			/* wrap() moved the origin under the pointer, so re-anchor the drag
			 * to where it now is. Without this the next move would snap back
			 * by a full copy width. */
			startX = e.clientX;
			startScroll = el.scrollLeft;
		} );

		function endDrag( e ) {
			if ( ! dragging ) {
				return;
			}

			dragging = false;
			el.classList.remove( 'is-ck-dragging' );

			if ( el.hasPointerCapture && el.hasPointerCapture( e.pointerId ) ) {
				el.releasePointerCapture( e.pointerId );
			}
		}

		el.addEventListener( 'pointerup', endDrag );
		el.addEventListener( 'pointercancel', endDrag );

		/* Start one copy in, so a first drag to the LEFT has somewhere to go
		 * rather than hitting scrollLeft 0 and stopping. */
		el.scrollLeft = half() / 2;

		if ( ! reduce ) {
			window.requestAnimationFrame( step );
		}
	}

	function start() {
		[].forEach.call( document.querySelectorAll( '.ck-marquee' ), initMarquee );
	}

	if ( 'loading' === document.readyState ) {
		document.addEventListener( 'DOMContentLoaded', start );
	} else {
		/* Images are still loading at this point and scrollWidth grows as they
		 * land, but every measurement above is taken per-frame, so the loop
		 * self-corrects rather than caching a stale width. */
		start();
	}
}() );
