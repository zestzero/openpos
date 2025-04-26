import { Navbar, PageLayout } from '@/shared/ui'
import { ProductPage } from '../Products/ProductPage'
import { ApiClientProvider } from '@/shared/api'

export function App() {
    return (
        <ApiClientProvider config={{ baseUrl: 'http://localhost/api' }}>
            <Navbar title="OpenPOS" />
            <PageLayout>
                <ProductPage />
            </PageLayout>
        </ApiClientProvider>
    )
}

export default App
