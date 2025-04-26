import { Client } from 'openapi-fetch'
import { createContext } from 'react'
import { paths } from '../generated'

export const ApiClientContext = createContext<Client<paths> | undefined>(
    undefined,
)
