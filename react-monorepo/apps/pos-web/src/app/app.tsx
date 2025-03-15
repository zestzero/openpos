import { Ui } from '@/shared/ui';
import { ProductPage } from '../Products/ProductPage';
import { ApiClientProvider } from '@/shared/api';

export function App() {
  return (
    <div>
      <ApiClientProvider config={{ baseUrl: 'http://localhost/api' }}>
        <Ui />
        <ProductPage />
      </ApiClientProvider>
    </div>
  );
}

export default App;
