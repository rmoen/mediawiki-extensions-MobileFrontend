( function( M, $ ) {
	M.assertMode( [ 'beta', 'alpha' ] );

	var Panel = M.require( 'Panel' ),
		schema = M.require( 'loggingSchemas/mobileWebWikiGrok' ),
		WikiGrokDialog;

	/**
	 * @class WikiGrokDialog
	 * @extends InlineDialog
	 * THIS IS AN EXPERIMENTAL FEATURE THAT MAY BE MOVED TO A SEPARATE EXTENSION.
	 * This creates the dialog at the bottom of the lead section that appears when a user
	 * scrolls past the lead. It asks the user to confirm metadata information for use
	 * in Wikidata (https://www.wikidata.org).
	 */
	WikiGrokDialog = Panel.extend( {
		className: 'wikigrok',
		defaults: {
			beginQuestions: false,
			thankUser: false,
			closeMsg: mw.msg( 'mobile-frontend-overlay-close' ),
			headerMsg: 'Help Wikipedia',
			contentMsg: 'Improve Wikipedia by tagging information on this page',
			// Other ideas:
			// Can you help improve Wikipedia?
			// Play a game to help Wikipedia!
			// Help add tags to this page!
			buttons: [
				{ classes: 'cancel inline mw-ui-button', label: 'No, thanks' },
				{ classes: 'proceed inline mw-ui-button mw-ui-progressive', label: 'Okay!' }
			],
			noticeMsg: '<a class="wg-notice-link" href="#/wikigrok/about">Tell me more</a>'
		},
		template: M.template.get( 'modules/wikigrok/WikiGrokDialog.hogan' ),

		log: function( action ) {
			var data = {
				action: action,
				version: 'version a'
			};
			schema.log( data );
		},

		askWikidataQuestion: function( options ) {
			var self = this;

			// Get potential occupations for the person.
			// FIXME: Create a client-side API class for interacting with the WikiGrok API
			$.ajax( {
				type: 'get',
				// https://github.com/kaldari/WikiGrokAPI
				url: 'https://tools.wmflabs.org/wikigrok/api.php',
				data: {
					'action': 'get_potential_occupations',
					// Strip the Q out of the Wikibase item ID
					'item': options.itemId.replace( 'Q' , '' )
				},
				dataType: 'jsonp',
				success: function( data ) {
					var occupationArray;

					// If there are potential occupations for this person, select one at
					// random and ask if it is a correct occupation for the person.
					if ( data.occupations !== undefined ) {
						occupationArray = data.occupations.split( ',' );
						// Choose a random occupation from the list of possible occupations.
						options.occupationId = 'Q' + occupationArray[ Math.floor( Math.random() * occupationArray.length ) ];
						// Remove any disambiguation parentheticals from the title.
						options.name = mw.config.get( 'wgTitle' ).replace( / \(.+\)$/, '' );

						// Get the name of the occupation from Wikidata.
						$.ajax( {
							type: 'get',
							url: 'https://www.wikidata.org/w/api.php',
							data: {
								'action': 'wbgetentities',
								'props': 'labels',
								'ids': options.occupationId,
								'format': 'json'
							},
							dataType: 'jsonp',
							success: function( data ) {
								var vowels = [ 'a', 'e', 'i', 'o', 'u' ];
								if ( data.entities[options.occupationId].labels.en.value !== undefined ) {
									// Re-render with new content for 'Question' step
									options.beginQuestions = true;
									options.occupation = data.entities[options.occupationId].labels.en.value;
									// Hack for English prototype
									if ( $.inArray( options.occupation.charAt(0), vowels ) === -1 ) {
										options.contentMsg = 'Was ' + options.name + ' a ' + options.occupation + '?';
									} else {
										options.contentMsg = 'Was ' + options.name + ' an ' + options.occupation + '?';
									}
									options.buttons = [
										{ classes: 'yes inline mw-ui-button mw-ui-progressive', label: 'Yes' },
										{ classes: 'not-sure inline mw-ui-button', label: 'Not Sure' },
										{ classes: 'no inline mw-ui-button mw-ui-progressive', label: 'No' }
									];
									options.noticeMsg = 'All submissions are <a class="wg-notice-link" href="#/wikigrok/about">released freely</a>';
									self.render( options );
								}
							}
						} );
					}
				}
			} );
		},

		// Record answer in temporary database for analysis.
		// Eventually answers will be recorded directly to Wikidata.
		recordClaim: function( options ) {
			var self = this;
			$.ajax( {
				type: 'get',
				url: 'https://tools.wmflabs.org/wikigrok/api.php',
				data: {
					'action': 'record_answer',
					'subject_id': options.itemId,
					'subject': options.name,
					'occupation_id': options.occupationId,
					'occupation': options.occupation,
					'page_name': mw.config.get( 'wgPageName' ),
					'correct': options.claimIsCorrect,
					'user_id': mw.config.get( 'wgUserId' ),
					'source': 'mobile A'
				},
				dataType: 'jsonp',
				success: function() {
					self.thankUser( options, true );
				}
			} );
		},

		thankUser: function( options, claimRecorded ) {
			options.thankUser = true;
			if ( claimRecorded ) {
				options.contentMsg = 'You just made Wikipedia a little better, thanks!';
				options.buttons = [
					{ classes: 'quit inline mw-ui-button mw-ui-progressive', label: 'Great!' }
				];
			} else {
				options.contentMsg = "That's OK, thanks for taking the time.";
				options.buttons = [
					{ classes: 'quit inline mw-ui-button mw-ui-progressive', label: 'Done' }
				];
			}
			options.noticeMsg = '<a class="wg-notice-link" href="#/wikigrok/about">Tell me more</a>';
			// Re-render with new content for 'Thanks' step
			this.render( options );
		},

		postRender: function( options ) {
			var self = this;

			// Insert the dialog into the page
			$( function() {
				// If there is a table of contents, insert before it.
				if ( $( '.toc-mobile' ).length ) {
					self.insertBefore( '.toc-mobile' );
				} else {
					self.appendTo( M.getLeadSection() );
				}
			} );

			// Initialize all the buttons and links
			// ...for final 'Thanks' step
			if ( options.thankUser ) {
				this.$( '.wg-buttons .quit' ).on( 'click', function() {
					self.hide();
				} );
			// ...for intermediate 'Question' step
			} else if ( options.beginQuestions ) {
				this.$( '.wg-buttons .yes' ).on( 'click', function() {
					self.log( 'success' );
					options.claimIsCorrect = 1;
					self.recordClaim( options );
				} );
				this.$( '.wg-buttons .not-sure' ).on( 'click', function() {
					self.log( 'notsure' );
					self.thankUser( options, false );
				} );
				this.$( '.wg-buttons .no' ).on( 'click', function() {
					self.log( 'success' );
					options.claimIsCorrect = 0;
					self.recordClaim( options );
				} );
			// ...for initial 'Intro' step
			} else {
				this.log( 'view' );
				this.$( '.wg-buttons .cancel' ).on( 'click', function() {
					self.hide();
					self.log( 'nothanks' );
					M.settings.saveUserSetting( 'mfHideWikiGrok', 'true' );
				} );
				this.$( '.wg-buttons .proceed' ).on( 'click', function() {
					self.log( 'attempt' );
					// Proceed with asking the user a metadata question.
					self.askWikidataQuestion( options );
				} );
				// Log more info clicks
				this.$( '.wg-notice-link' ).on( 'click', function() {
					self.log( 'moreinfo' );
				} );
			}

			// render() does a "deep copy" $.extend() on the template data, so we need
			// to reset the buttons after each step (since some steps have fewer
			// buttons than the initial default).
			self.options.buttons = [];

			this.show();
		}
	} );

	M.define( 'modules/wikigrok/WikiGrokDialog', WikiGrokDialog );
}( mw.mobileFrontend, jQuery ) );