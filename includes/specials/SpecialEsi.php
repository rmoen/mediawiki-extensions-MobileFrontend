<?php

class SpecialEsi extends UnlistedSpecialPage {
	public function __construct() {
		parent::__construct( 'Esi' );
	}

	public function execute( $par ) {
		global $wgEsiHandlers;

		if ( !isset( $wgEsiHandlers[$par] ) ) {
			throw new MWException( 'Unrecognised ESIchunk name' );
		}

		$this->getOutput()->disable();

		call_user_func( $wgEsiHandlers[$par], $this->getContext() );
	}
}
