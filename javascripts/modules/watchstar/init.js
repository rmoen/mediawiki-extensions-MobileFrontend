( function ( M, $ ) {

	var Watchstar = M.require( 'modules/watchstar/Watchstar' ),
		user = M.require( 'user' );

	/**
	 * Toggle the watch status of a known page
	 * @method
	 * @param {Page} page
	 * @ignore
	 */
	function init( page ) {
		var $container = $( '#ca-watch' );
		if ( !page.inNamespace( 'special' ) ) {
			new Watchstar( {
				el: $container,
				isWatched: page.isWatched(),
				page: page,
				isAnon: user.isAnon()
			} );
		}
	}
	init( M.getCurrentPage() );

}( mw.mobileFrontend, jQuery ) );
