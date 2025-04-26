import createClient, { ClientOptions } from 'openapi-fetch'
import { ApiClientContext } from './apiClientContext'

export type ApiClientProvider = React.PropsWithChildren<{
    config: ClientOptions
}>

export const ApiClientProvider = ({ children, config }: ApiClientProvider) => {
    const client = createClient(config)
    return (
        <ApiClientContext.Provider value={client}>
            {children}
        </ApiClientContext.Provider>
    )
}
