'use client'
import { registerComponents } from '../register'
import { productComponents } from './registry'

export const productsArray = registerComponents(productComponents)
