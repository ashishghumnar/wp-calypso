/** @format */

/**
 * External dependencies
 */
import { expect } from 'chai';

/**
 * Internal dependencies
 */
import { getTimezonesLabels } from 'state/selectors';

describe( 'getTimezonesLabels()', () => {
	test( "should return {} if `timezones` aren't synced", () => {
		const state = {
			timezones: {
				byContinents: {},
				labels: {},
				rawOffsets: {},
			},
		};

		const timezonesLabels = getTimezonesLabels( state );

		expect( timezonesLabels ).to.eql( {} );
	} );

	test( 'should return timezones by contienent object data', () => {
		const state = {
			timezones: {
				byContinents: {},
				labels: {
					'Asia/Aqtobe': 'Aqtobe',
					'America/Boa_Vista': 'Boa Vista',
					'Indian/Comoro': 'Comoro',
				},
				rawOffsets: {},
			},
		};

		const labels = getTimezonesLabels( state );

		expect( labels ).to.eql( {
			'Asia/Aqtobe': 'Aqtobe',
			'America/Boa_Vista': 'Boa Vista',
			'Indian/Comoro': 'Comoro',
		} );
	} );
} );
