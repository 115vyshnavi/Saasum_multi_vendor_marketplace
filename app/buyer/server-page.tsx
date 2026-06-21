import { getActiveProducts, getCategories } from '@/lib/products'
import BuyerPageClient from './page'

export default async function BuyerPage() {
  const [products, categories] = await Promise.all([
    getActiveProducts(),
    getCategories()
  ])

  return <BuyerPageClient initialProducts={products} categories={categories} />
}