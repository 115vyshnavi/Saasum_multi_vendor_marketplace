// /shop is the buyer storefront destination. It reuses the existing
// buyer marketplace experience so buyers land here after signup/login.
import { getActiveProducts, getCategories, getProductsByCategory } from '@/lib/products'
import BuyerPageClient from '../buyer/client-page'

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const params = await searchParams
  const categorySlug = params?.category

  const [products, categories] = await Promise.all([
    categorySlug ? getProductsByCategory(categorySlug) : getActiveProducts(),
    getCategories()
  ])

  return <BuyerPageClient initialProducts={products} categories={categories} />
}
