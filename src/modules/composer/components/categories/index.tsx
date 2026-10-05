'use client'
import { registerComponents } from '../register'
import { categoryComponents } from './registry'

export const categoriesArray = registerComponents(categoryComponents)
