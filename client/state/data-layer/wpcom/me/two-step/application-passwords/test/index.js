/** @format */

/**
 * Internal dependencies
 */
import { fromApi, handleRequestSuccess, requestApplicationPasswords } from '../';
import { http } from 'state/data-layer/wpcom-http/actions';
import { receiveApplicationPasswords } from 'state/application-passwords/actions';

const appPasswords = [
	{
		ID: 12345,
		name: 'example',
		generated: '2012-01-01T00:00:00+00:00',
	},
];

describe( 'requestApplicationPasswords()', () => {
	test( 'should return an action for HTTP request to request the application passwords', () => {
		const action = requestApplicationPasswords();

		expect( action ).toEqual(
			http( {
				apiVersion: '1.1',
				method: 'GET',
				path: '/me/two-step/application-passwords',
			} )
		);
	} );
} );

describe( 'handleRequestSuccess()', () => {
	test( 'should return an application passwords receive action', () => {
		const action = handleRequestSuccess( null, appPasswords );

		expect( action ).toEqual( receiveApplicationPasswords( appPasswords ) );
	} );
} );

describe( 'fromApi()', () => {
	test( 'should throw an error for an unsuccessful request', () => {
		expect( () => fromApi( { error: 'This is some error' } ) ).toThrow();
	} );

	test( 'should return application_passwords from original response for a successful request', () => {
		expect( fromApi( { application_passwords: appPasswords } ) ).toEqual( appPasswords );
	} );
} );
