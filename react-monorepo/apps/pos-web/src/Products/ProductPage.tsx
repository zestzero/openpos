import { operations, useApiClient } from '@openpos/api'
import { useEffect, useState } from 'react'

export const ProductPage = () => {
  const [products, setProducts] = useState<
    operations['getProducts']['responses']['default']['content']['application/json']
  >([])
  const { GET } = useApiClient()

  useEffect(() => {
    const request = async () => {
      const response = await GET('/products')
      setProducts(response.data ?? [])
    }

    request()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div>
      {products.map((product) => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  )
}
