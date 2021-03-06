/** @format */
/**
 * External dependencies
 */
import page from 'page';
import { stringify } from 'qs';
import { translate } from 'i18n-calypso';
import React from 'react';
import { get, noop } from 'lodash';

/**
 * Internal Dependencies
 */
import analytics from 'lib/analytics';
import DocumentHead from 'components/data/document-head';
import { sectionify } from 'lib/route';
import Main from 'components/main';
import { addItem } from 'lib/upgrades/actions';
import productsFactory from 'lib/products-list';
import { canCurrentUser } from 'state/selectors';
import { getSelectedSiteId, getSelectedSite, getSelectedSiteSlug } from 'state/ui/selectors';
import { getCurrentUser } from 'state/current-user/selectors';
import CartData from 'components/data/cart';
import DomainSearch from './domain-search';
import SiteRedirect from './domain-search/site-redirect';
import MapDomain from 'my-sites/domains/map-domain';
import TransferDomain from 'my-sites/domains/transfer-domain';
import TransferDomainStep from 'components/domains/transfer-domain-step';
import GoogleApps from 'components/upgrades/google-apps';
import { domainManagementTransferIn } from 'my-sites/domains/paths';
import { isATEnabled } from 'lib/automated-transfer';
import JetpackManageErrorPage from 'my-sites/jetpack-manage-error-page';
import { makeLayout, render as clientRender } from 'controller';

/**
 * Module variables
 */
const productsList = productsFactory();

const domainsAddHeader = ( context, next ) => {
	context.getSiteSelectionHeaderText = () => {
		return translate( 'Select a site to add a domain' );
	};

	next();
};

const domainsAddRedirectHeader = ( context, next ) => {
	context.getSiteSelectionHeaderText = () => {
		return translate( 'Select a site to add Site Redirect' );
	};

	next();
};

const redirectToDomainSearchSuggestion = context => {
	return page.redirect(
		`/domains/add/${ context.params.domain }?suggestion=${ context.params.suggestion }`
	);
};

const domainSearch = ( context, next ) => {
	const basePath = sectionify( context.path );

	analytics.pageView.record( basePath, 'Domain Search > Domain Registration' );

	// Scroll to the top
	if ( typeof window !== 'undefined' ) {
		window.scrollTo( 0, 0 );
	}

	context.primary = (
		<Main>
			<DocumentHead title={ translate( 'Domain Search' ) } />
			<CartData>
				<DomainSearch basePath={ basePath } context={ context } />
			</CartData>
		</Main>
	);
	next();
};

const siteRedirect = ( context, next ) => {
	const basePath = sectionify( context.path );

	analytics.pageView.record( basePath, 'Domain Search > Site Redirect' );

	context.primary = (
		<Main>
			<DocumentHead title={ translate( 'Redirect a Site' ) } />
			<CartData>
				<SiteRedirect />
			</CartData>
		</Main>
	);
	next();
};

const mapDomain = ( context, next ) => {
	const basePath = sectionify( context.path );

	analytics.pageView.record( basePath, 'Domain Search > Domain Mapping' );
	context.primary = (
		<Main>
			<DocumentHead title={ translate( 'Map a Domain' ) } />

			<CartData>
				<MapDomain initialQuery={ context.query.initialQuery } />
			</CartData>
		</Main>
	);
	next();
};

const transferDomain = ( context, next ) => {
	const basePath = sectionify( context.path );

	analytics.pageView.record( basePath, 'Domain Search > Domain Transfer' );
	context.primary = (
		<Main>
			<DocumentHead title={ translate( 'Transfer a Domain' ) } />
			<CartData>
				<TransferDomain basePath={ basePath } initialQuery={ context.query.initialQuery } />
			</CartData>
		</Main>
	);
	next();
};

const transferDomainPrecheck = ( context, next ) => {
	const basePath = sectionify( context.path );
	const state = context.store.getState();
	const siteSlug = getSelectedSiteSlug( state ) || '';
	const domain = get( context, 'params.domain', '' );

	const handleGoBack = () => {
		page( domainManagementTransferIn( siteSlug, domain ) );
	};

	analytics.pageView.record( basePath, 'My Sites > Domains > Selected Domain' );
	context.primary = (
		<Main>
			<CartData>
				<div>
					<TransferDomainStep
						forcePrecheck={ true }
						initialQuery={ domain }
						goBack={ handleGoBack }
					/>
				</div>
			</CartData>
		</Main>
	);
	next();
};

const googleAppsWithRegistration = ( context, next ) => {
	const state = context.store.getState();
	const siteSlug = getSelectedSiteSlug( state ) || '';

	const handleAddGoogleApps = googleAppsCartItem => {
		addItem( googleAppsCartItem );
		page( '/checkout/' + siteSlug );
	};

	const handleGoBack = () => {
		page( '/domains/add/' + siteSlug );
	};

	const handleClickSkip = () => {
		page( '/checkout/' + siteSlug );
	};

	analytics.pageView.record(
		'/domains/add/:site/google-apps',
		'Domain Search > Domain Registration > Google Apps'
	);

	context.primary = (
		<Main>
			<DocumentHead
				title={ translate( 'Register %(domain)s', {
					args: { domain: context.params.registerDomain },
				} ) }
			/>
			<CartData>
				<GoogleApps
					productsList={ productsList }
					domain={ context.params.registerDomain }
					onGoBack={ handleGoBack }
					onAddGoogleApps={ handleAddGoogleApps }
					onClickSkip={ handleClickSkip }
				/>
			</CartData>
		</Main>
	);
	next();
};

const redirectIfNoSite = redirectTo => {
	return ( context, next ) => {
		const state = context.store.getState();
		const siteId = getSelectedSiteId( state );
		const userCanManageOptions = canCurrentUser( state, siteId, 'manage_options' );

		if ( ! userCanManageOptions ) {
			const user = getCurrentUser( state );
			const visibleSiteCount = get( user, 'visible_site_count', 0 );
			//if only one site navigate to stats to avoid redirect loop
			const redirect = visibleSiteCount > 1 ? redirectTo : '/stats';
			return page.redirect( redirect );
		}
		next();
	};
};

const redirectToAddMappingIfVipSite = () => {
	return ( context, next ) => {
		const state = context.store.getState();
		const selectedSite = getSelectedSite( state );
		const domain = context.params.domain ? `/${ context.params.domain }` : '';
		const query = stringify( { initialQuery: context.params.suggestion } );

		if ( selectedSite && selectedSite.is_vip ) {
			return page.redirect( `/domains/add/mapping${ domain }?${ query }` );
		}

		next();
	};
};

const jetpackNoDomainsWarning = ( context, next ) => {
	const state = context.store.getState();
	const basePath = sectionify( context.path );
	const selectedSite = getSelectedSite( state );

	if ( selectedSite && selectedSite.jetpack && ! isATEnabled( selectedSite ) ) {
		context.primary = (
			<Main>
				<JetpackManageErrorPage template="noDomainsOnJetpack" siteId={ selectedSite.ID } />
			</Main>
		);

		analytics.pageView.record( basePath, '> No Domains On Jetpack' );

		makeLayout( context, noop );
		clientRender( context );
	} else {
		next();
	}
};

export default {
	domainsAddHeader,
	domainsAddRedirectHeader,
	domainSearch,
	jetpackNoDomainsWarning,
	siteRedirect,
	mapDomain,
	googleAppsWithRegistration,
	redirectIfNoSite,
	redirectToAddMappingIfVipSite,
	redirectToDomainSearchSuggestion,
	transferDomain,
	transferDomainPrecheck,
};
