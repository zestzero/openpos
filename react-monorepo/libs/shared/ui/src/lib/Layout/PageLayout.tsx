import { PropsWithChildren } from 'react'

export type PageLayoutProps = PropsWithChildren

export const PageLayout = (props: PageLayoutProps) => {
    const { children } = props
    return (
        <div className="flex flex-col h-screen">
            <header className="bg-gray-800 text-white p-4">
                <h1 className="text-2xl">Page Layout Header</h1>
            </header>
            <main className="flex-1 p-4">
                <h2 className="text-xl">{children}</h2>
            </main>
            <footer className="bg-gray-800 text-white p-4">
                <p>Page Layout Footer</p>
            </footer>
        </div>
    )
}
