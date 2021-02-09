import { ClientFunction } from 'testcafe'
import testConfig from '../../testConfig'
import {
	adminClientSetup,
	buyerTestSetup,
	baseTestCleanup,
} from '../../helpers/test-setup'
import buyerHeaderPage from '../../pages/buyer/buyer-header-page'
import productListPage from '../../pages/buyer/product-list-page'
import productDetailPage from '../../pages/buyer/product-detail-page'
import shoppingCartPage from '../../pages/buyer/shopping-cart-page'
import { createRegExp } from '../../helpers/regExp-helper'

const getLocation = ClientFunction(() => document.location.href)

fixture`Product Catalog Tests`
	.meta('TestRun', '1')
	.before(async ctx => {
		ctx.adminClientAuth = await adminClientSetup()
	})
	.beforeEach(async t => {
		t.ctx.testUser = await buyerTestSetup(t.fixtureCtx.adminClientAuth)
	})
	.afterEach(async t => {
		await baseTestCleanup(
			t.ctx.testUser.ID,
			'0005',
			t.fixtureCtx.adminClientAuth
		)
	})
	.page(testConfig.buyerAppUrl)

test('Can the User select a Variant Product | 6789', async t => {
	const productName = '100 CLASS T-SHIRT'
	const sizeVariant = 'Medium'

	await buyerHeaderPage.search(productName)
	await productListPage.clickProduct(productName)
	await productDetailPage.selectSizeVariant(sizeVariant)

	//assert variant selection exists
	await t
		.expect(
			productDetailPage.sizeDropdown.withText(createRegExp(sizeVariant))
				.exists
		)
		.ok()
})

test('Can the page be affected by adjusting facets | 6790', async t => {
	await buyerHeaderPage.clickProductsLink()

	const facetName = 'COLOR'
	const facetValue = 'Black'
	const expectedProductName =
		'10X20 ML POP UP CANOPY TENT ALUMINUM COMMERCIAL GRADE WITH ROLLER BAG'
	const beforeFacetFirstProductName = await productListPage.products.nth(0)
		.innerText
	const facetCheckbox = productListPage.facets
		.withText(createRegExp(facetName))
		.find('label')
		.withText(createRegExp(facetValue))
		.parent(0)
		.find('input')

	await productListPage.applyFacet(facetName, facetValue)

	//assert the facet is selected
	await t.expect(facetCheckbox.checked).ok()

	//assert that list with facet selection is different than initial list
	await t.expect(beforeFacetFirstProductName).notContains(expectedProductName)

	//assert that facet selection updated list with expected first product
	await t
		.expect(
			(await productListPage.products.nth(0).innerText).includes(
				expectedProductName
			)
		)
		.ok()
})

test('Does the Sort By dropdown properly adjust the order that items populate', async t => {
	await buyerHeaderPage.clickProductsLink()
	const beforeSortFirstProductName = await productListPage.products.nth(0)
		.innerText
	await productListPage.sortProducts('Name: Z to A')
	const afterSortFirstProductName = await productListPage.products.nth(0)
		.innerText

	//assert that first product name after Z to A sort is greater (later in the alphabet) than before the sort
	await t
		.expect(
			afterSortFirstProductName.substring(0, 1) >
				beforeSortFirstProductName.substring(0, 1)
		)
		.ok()
})

test('Does selecting a Product Card bring the User to the details page | 6791', async t => {
	const productName = '100 CLASS T-SHIRT'
	await buyerHeaderPage.search(productName)

	//assert not on product details page
	await t.expect(getLocation()).notContains('/products/')

	await productListPage.clickProduct(productName)

	//assert user is on product details page after product click
	await t.expect(getLocation()).contains('/products/')
	await t.expect(productDetailPage.addToCartButton.exists).ok()
})

test('Can a User add a product to their Cart from the Catalog page | 6792', async t => {
	const productName = '100 CLASS T-SHIRT'
	await buyerHeaderPage.search(productName)
	await productListPage.clickProduct(productName)
	await productDetailPage.clickAddToCartButton()
	await buyerHeaderPage.clickCartButton()

	//assert that the product is in the cart page
	await t
		.expect(
			shoppingCartPage.products.withText(createRegExp(productName)).exists
		)
		.ok()

	//assert that one product is there 0+9
	await t.expect(shoppingCartPage.products.count).eql(1)
})
