import { Theme } from '@radix-ui/themes'
import { RouterProvider } from 'react-router'
import { router } from './router'
import { BrandProvider } from '@/context/BrandContext'

export function App() {
  return (
    <Theme
      accentColor="indigo"
      grayColor="slate"
      radius="large"
      scaling="100%"
      appearance="light"
      hasBackground={false}
    >
      <BrandProvider>
        <RouterProvider router={router} />
      </BrandProvider>
    </Theme>
  )
}
