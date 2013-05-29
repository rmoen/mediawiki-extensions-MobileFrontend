// FIXME: Turn into extension of api module
( function( M, $ ) {
	var api = M.require( 'api' ),
		// Internal cache for storing all availabe language codes on the site
		_languageCache,
		cache = {};

	/**
	 * Gathers a mapping of all available language codes on the site and their human readable names
	 *
	 * @return {jQuery.Deferred} where argument is a javascript object with language codes as keys
	 */
	function retrieveAllLanguages() {
		if ( !_languageCache ) {
			_languageCache = api.get( {
				action: 'query',
				meta: 'siteinfo',
				siprop: 'languages',
				format: 'json'
			} ).then( function( data ) {
				var languages = {};
				data.query.languages.forEach( function( item ) {
					languages[ item.code ] = item[ '*' ];
				} );
				return languages;
			} );
		}
		return _languageCache;
	}

	/**
	 * Retrieve available languages for a given title
	 *
	 * @param {Object} title the title of the page languages should be retrieved for
	 * @param {Object} allAvailableLanguages a mapping of language codes to language names
	 * @return {jQuery.Deferred} which is called with a mapping of language codes to language names
	*/
	function retrievePageLanguages( title, allAvailableLanguages ) {
		return api.get( {
			action: 'query',
			prop: 'langlinks',
			llurl: true,
			lllimit: 'max',
			titles: title
		} ).then( function( resp ) {
			// FIXME: API returns an object when a list makes much more sense
			var pages = $.map( resp.query.pages, function( v ) { return v; } ),
				// FIXME: "|| []" wouldn't be needed if API was more consistent
				langlinks = pages[0] ? pages[0].langlinks || [] : [];

			langlinks.forEach( function( item, i ) {
				langlinks[ i ].langname = allAvailableLanguages[ item.lang ];
			} );
			return langlinks;
		} );
	}

	/**
	 * Retrieve a page from the api
	 *
	 * @param {Object} pageTitle the title of the page to be retrieved
	 * @param {String} endpoint an alternative api url to retreive the page from
	 * @param {Boolean} leadOnly When set only the lead section content is returned
	 * @return {jQuery.Deferred} with parameter page data that can be passed to a Page view
	 */
	function retrievePage( pageTitle, endpoint, leadOnly ) {
		var cachedPage = cache[ pageTitle ],
			options = endpoint ? { url: endpoint, dataType: 'jsonp' } : {};

		if ( !cachedPage ) {
			cachedPage = $.Deferred().fail( function() {
				delete cache[ pageTitle ];
			} );
			api.get( {
				action: 'mobileview',
				page: pageTitle,
				variant: mw.config.get( 'wgPreferredVariant' ),
				redirects: 'yes', prop: 'sections|text', noheadings: 'yes',
				noimages: mw.config.get( 'wgImagesDisabled', false ) ? 1 : undefined,
				sectionprop: 'level|line|anchor', sections: leadOnly ? 0 : 'all'
			}, options ).then( function( r ) {
				if ( r.error || !r.mobileview.sections ) {
					cachedPage.reject( r );
				} else {
					cachedPage.resolve( {
						title: pageTitle,
						sections: r.mobileview.sections,
						isMainPage: r.mobileview.hasOwnProperty( 'mainpage' ) ? true : false
					} );
				}
			} ).fail( function( r ) {
				cachedPage.reject( r );
			} );
			cache[ pageTitle ] = cachedPage;
		}
		return cachedPage;
	}

	M.history = $.extend( M.history, {
		retrieveAllLanguages: retrieveAllLanguages,
		retrievePage: retrievePage,
		retrievePageLanguages: retrievePageLanguages
	} );

	M.on( 'section-rendered', function( $content ) {
		// FIXME: this should live in the hidpi module when dynamic sections is promoted from beta
		if ( $content.hidpi ) {
			$content.hidpi();
		}
	} );

} ( mw.mobileFrontend, jQuery ) );
