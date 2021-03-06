// Add EventLogging to hamburger menu
( function ( M, $ ) {
	var SchemaMobileWebClickTracking = M.require( 'loggingSchemas/SchemaMobileWebClickTracking' ),
		skin = M.require( 'skin' ),
		mainMenuSchema = new SchemaMobileWebClickTracking( {}, 'MobileWebMainMenuClickTracking' ),
		uiSchema = new SchemaMobileWebClickTracking( {}, 'MobileWebUIClickTracking' );

	$( function () {
		var $profileLink = $( '#mw-mf-last-modified a' )
			.filter( function () {
				return $( this ).children().length === 0;
			} );

		$( '#mw-mf-main-menu-button' ).on( 'click', function () {
			uiSchema.log( {
				name: 'hamburger'
			} );
		} );

		skin.getMainMenu().enableLogging( mainMenuSchema );
		uiSchema.hijackLink( $( '#mw-mf-last-modified a span' ).parent(), 'lastmodified-history' );
		uiSchema.hijackLink( $profileLink, 'lastmodified-profile' );
		uiSchema.hijackLink( '.nearby-button', 'nearby-button' );
	} );
} )( mw.mobileFrontend, jQuery );
