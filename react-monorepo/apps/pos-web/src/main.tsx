import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
