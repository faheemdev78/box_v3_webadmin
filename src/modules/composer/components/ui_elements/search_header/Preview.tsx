'use client'
import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowLeft, faArrowUpFromBracket, faChevronDown, faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'
import { parseStylesOutput } from '../../../lib'
import type { ComposerItem } from '../../types'
import { productInk } from '../../products/theme'
import type { SearchHeaderValues } from './config'
import css from './SearchHeader.module.scss'

export function SearchHeaderPreview({ item }: { item: ComposerItem<SearchHeaderValues> }) {
    return <div className={css.header} style={{ color: productInk(item.values?.theme), backgroundColor: '#fff', ...parseStylesOutput(item.styles || {}) } as React.CSSProperties}>
        <span className={css.button}><FontAwesomeIcon icon={faArrowLeft} /></span>
        <div className={css.address}>
            <div className={css.title}>Delivering to Mr chipps <FontAwesomeIcon icon={faChevronDown} /></div>
            <div className={css.subtitle}>54 high street, Bhuleshwar, Mumbai</div>
        </div>
        <span className={css.button}><FontAwesomeIcon icon={faMagnifyingGlass} /></span>
        <span className={css.button}><FontAwesomeIcon icon={faArrowUpFromBracket} /></span>
    </div>
}
