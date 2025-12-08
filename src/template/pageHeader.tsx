'use client'

import React, { ReactNode } from 'react';
import { BackButton, Button, IconButton, SearchBar } from '@_/components';
import { Checkbox, Col, Dropdown, Popover, Row, Space } from 'antd';
import { PageTitle } from './pageTitle';

interface SearchFieldSelectorProps {
    searchFields: any[];
}
function SearchFieldSelector({ searchFields }: SearchFieldSelectorProps) {
    function onSelect() { }

    return (<>
        <Popover
            title="Search Fields"
            trigger="click"
            content={() => (<Space direction='vertical'>
                {searchFields.map((item, i) => (<Checkbox onChange={onSelect} value={item.value} key={i}>{item.label}</Checkbox>))}
                {/* <Checkbox onChange={console.log}>Field 1</Checkbox> <Checkbox onChange={console.log}>Field 4</Checkbox> */}
            </Space>)}
        >
            <IconButton onClick={(e) => e.preventDefault()} type="link" icon="ellipsis-v" shape="circle" />
        </Popover>
    </>)
}


interface PageHeaderProps {
    title: ReactNode;
    sub?: ReactNode; // string, number, JSX.Element, ReactElement, null, undefined, boolean, and arrays of those.
    onSearch?: (value: string) => void;
    searchFields?: any[];
    children?: ReactNode;
    allowBack?: boolean | true;
}
// export function PageHeader({ title, sub, onSearch, searchFields, children }) {
export function PageHeader({ title, sub, onSearch, searchFields, children, allowBack }: PageHeaderProps) {
    return (<div className='page-header'><div className='page-header-inner'>
        <Row align='middle' gutter={[10, 10]}>
            {allowBack &&  <Col><BackButton onClick={undefined} tooltip={undefined} /></Col>}
            <Col flex="auto"><Space>
                <PageTitle>{title}</PageTitle>
                {sub}
            </Space></Col>
            <Col><Space>
                {onSearch && <>
                    <SearchBar
                        style={{ maxWidth: "200px", minWidth: "200px", marginTop: "10px" }}
                        onSearch={console.log}
                        size="medium"
                        onFocus={undefined}
                        placeholder={undefined}
                        timeout={undefined}
                        permanentFilter={undefined}
                        filter={undefined}
                        onFilterUpdate={undefined}
                        onChange={undefined}
                        loading={undefined}
                        returnJson={undefined}
                    />
                    {searchFields && <SearchFieldSelector searchFields={searchFields} />}
                </>}
                {children}
            </Space></Col>
        </Row>
    </div></div>)
}
