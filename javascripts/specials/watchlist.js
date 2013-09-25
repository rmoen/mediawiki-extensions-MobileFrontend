( function( M, $ ) {
	var star = M.require( 'watchstar' ),
		qs = window.location.search.substr( 1 ),
		schema = M.require( 'loggingSchemas/MobileWebClickTracking' ),
		pageName = mw.config.get( 'wgCanonicalSpecialPageName' ) === 'Watchlist' ? 'watchlist' : 'diff',
		params = mw.mobileFrontend.deParam( qs ),
		subPageName = params.watchlistview || 'a-z';

	function init() {
		var $watchlist = $( 'ul.page-list' ),
			actionNamePrefix = pageName + '-' + subPageName + '-';

		// FIXME: find more elegant way to not show watchlist stars on recent changes
		if ( $( '.mw-mf-watchlist-selector' ).length === 0 ) {
			star.initWatchListIconList( $watchlist, true );
			$watchlist.find( 'a.title' ).on( 'mousedown', function() {
				// name funnel for watchlists to catch subsequent uploads
				$.cookie( 'mwUploadsFunnel', 'watchlist', { expires: new Date( new Date().getTime() + 60000 ) } );
			} );
		}

		// Register EventLogging events
		schema.hijackLink( '.header .button-bar a', actionNamePrefix + 'switch' );
		schema.hijackLink( '.mw-mf-watchlist-selector a', actionNamePrefix + 'filter' );
		schema.hijackLink( '.page-list .title', actionNamePrefix + 'view' );
		schema.hijackLink( '.more', actionNamePrefix + 'more' );

		M.on( 'watch', function( isWatched ) {
			var action = isWatched ? 'unwatch' : 'watch';
			schema.log( actionNamePrefix + action );
		} );
	}

	$( function() {
		init();
	} );

} )( mw.mobileFrontend, jQuery );
