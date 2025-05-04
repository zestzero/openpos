import { ProductPage } from '../Products/ProductPage'
import { ApiClientProvider } from '@openpos/api'

export function App() {
    return (
        <ApiClientProvider config={{ baseUrl: 'http://localhost/api' }}>
            <ProductPage />
            <div className="carousel rounded-box">
                <div className="carousel-item">
                    <img
                        src="https://img.daisyui.com/images/stock/photo-1559703248-dcaaec9fab78.webp"
                        alt="Burger"
                    />
                </div>
                <div className="carousel-item">
                    <img
                        src="https://img.daisyui.com/images/stock/photo-1565098772267-60af42b81ef2.webp"
                        alt="Burger"
                    />
                </div>
                <div className="carousel-item">
                    <img
                        src="https://img.daisyui.com/images/stock/photo-1572635148818-ef6fd45eb394.webp"
                        alt="Burger"
                    />
                </div>
                <div className="carousel-item">
                    <img
                        src="https://img.daisyui.com/images/stock/photo-1494253109108-2e30c049369b.webp"
                        alt="Burger"
                    />
                </div>
                <div className="carousel-item">
                    <img
                        src="https://img.daisyui.com/images/stock/photo-1550258987-190a2d41a8ba.webp"
                        alt="Burger"
                    />
                </div>
                <div className="carousel-item">
                    <img
                        src="https://img.daisyui.com/images/stock/photo-1559181567-c3190ca9959b.webp"
                        alt="Burger"
                    />
                </div>
                <div className="carousel-item">
                    <img
                        src="https://img.daisyui.com/images/stock/photo-1601004890684-d8cbf643f5f2.webp"
                        alt="Burger"
                    />
                </div>
            </div>
            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Total Page Views</div>
                    <div className="stat-value">89,400</div>
                    <div className="stat-desc">21% more than last month</div>
                </div>
            </div>
        </ApiClientProvider>
    )
}

export default App
