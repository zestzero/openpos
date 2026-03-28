import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/pos/')({
  component: () => (
    <div className="p-4 text-center">
      <h1 className="text-xl font-semibold">OpenPOS</h1>
      <p className="text-sm text-zinc-500 mt-2">POS interface loading...</p>
    </div>
  ),
})
