import { getActiveProducts, getCategories, getProductsByCategory } from '@/lib/products'
import BuyerPageClient from './client-page'

export default async function BuyerPage({
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
