import { createRoute } from '@tanstack/react-router'
import { z } from 'zod'

import { useAppForm } from '../hooks/demo.form'

import type { RootRoute } from '@tanstack/react-router'
import { getProducts } from '@/client'
import { useQuery } from '@tanstack/react-query'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
})

function ProductListPage() {
  const { data } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  })

  console.log(data)

  const form = useAppForm({
    defaultValues: {
      title: '',
      description: '',
    },
    validators: {
      onBlur: schema,
    },
    onSubmit: ({ value }) => {
      console.log(value)
      // Show success message
      alert('Form submitted successfully!')
    },
  })

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 p-4 text-white flex-col">
      <h1 className="text-2xl font-bold mb-4">Product List</h1>
      <div className="w-full max-w-2xl p-8 rounded-xl backdrop-blur-md bg-black/50 shadow-xl border-8 border-black/10">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
          className="space-y-6"
        >
          <form.AppField name="title">
            {(field) => <field.TextField label="Title" />}
          </form.AppField>

          <form.AppField name="description">
            {(field) => <field.TextArea label="Description" />}
          </form.AppField>

          <div className="flex justify-end">
            <form.AppForm>
              <form.SubscribeButton label="Submit" />
            </form.AppForm>
          </div>
        </form>
      </div>
    </div>
  )
}

export default (parentRoute: RootRoute) =>
  createRoute({
    path: '/product/list',
    component: ProductListPage,
    getParentRoute: () => parentRoute,
  })
