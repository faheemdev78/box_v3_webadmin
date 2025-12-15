'use client'

import React, { useState, useEffect } from 'react'
import { useMutation, useLazyQuery } from '@apollo/client/react';
import { Alert, Card, Col, message, Popconfirm, Row, Space } from 'antd';
import { adminRoot, defaultPageSize } from '@/configs';
import Link from 'next/link';
// import StoreWrapper from '@/modules/store/storeWrapper';
import { UsersList } from '@/modules/users';
import { Page, PageHeader } from '@/template';
import { Button, usePageProps } from '@/components';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import { __error } from '@/lib/consoleHelper';
import { ViewFilter, ViewConfig } from '@/components/ViewFilter';
import { createStaffViewConfig, INITIAL_STAFF_VIEWS } from './components/staffViewConfig';

import LIST_DATA from '@/graphql/users/staffQuery.graphql'
import RECORD_DELETE from '@/graphql/geo_zone/deleteGeoZone.graphql';

const defaultFilter = {}; // { status: 'online' }



function Staff() {
    const { store } = usePageProps() as unknown as { store: any }

    const [state, setState] = useState({
        pagination: { current: 1 },
        pageView: "list",
        filter: { ...defaultFilter, "store._id": store._id },
        busy: false,
    })

    const [dataArray, set_dataArray] = useState<any>(null)
    const [savedViews, setSavedViews] = useState<ViewConfig[]>(INITIAL_STAFF_VIEWS)
    const [activeView, setActiveView] = useState<ViewConfig | null>(null)

    const [deleteGeoZone, del_results] = useMutation<any>(RECORD_DELETE); // { data, loading, error }

    const [staffQuery, { called, loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

    useEffect(() => {
        if (called || loading) return
        fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [store._id, called, loading])

    const fetchData = async (args: { pageSize?: number; current?: number; filter?: any } = {}) => {
        let limit = args?.pageSize || defaultPageSize;
        let current = args?.current || 1;
        let skip = limit * (current - 1);

        let filter = { ...state.filter };
        if (args.filter) filter = { ...args.filter };
        // Object.assign(filter, { "store._id": store._id })

        setState({ ...state, filter, pagination: { current } })

        const results = await staffQuery({
            variables: {
                limit,
                page: skip,
                filter: JSON.stringify(filter), // JSON.stringify(filter), 
                others: JSON.stringify({})
            }
        })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.staffQuery }))
            .catch(catchApolloError)

        if (results && results.error) {
            message.error((results && results?.error?.message) || "No records found!")
            return false;
        }

        set_dataArray(results)
    }
    const onUpdateCallback = () => fetchData()

    const handleDelete = async ({ _id="" }) => {
        let results = await deleteGeoZone({ variables: { _id } })
            .then(r => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr:any) => rr?.data?.deleteGeoZone }))
            .catch(catchApolloError)
            
        if (!results || results.error) {
            message.error((results && results?.error?.message) || "Unable to delete record")
            return false;
        }

        message.success("Record deleted")
    }


    // Create view configuration for current user
    const viewConfig = createStaffViewConfig({
        id: 'admin_user', // In production, get from auth context (using admin_user to match demo views)
        role: 'admin', // In production, get from auth context
        teamId: store._id
    });

    // View callbacks
    const viewCallbacks = {
        onApplyView: (view: ViewConfig) => {
            setActiveView(view);
            // TODO: Apply filters to the staff query
            // Convert view.filterGroups to GraphQL filter format
            console.log('Applying view:', view);
            message.info(`Applied view: ${view.name}`);
        },
        onSaveView: async (view: ViewConfig) => {
            // TODO: Save to database via GraphQL mutation
            setSavedViews([...savedViews, view]);
            console.log('Saving view:', view);
        },
        onUpdateView: async (view: ViewConfig) => {
            // TODO: Update in database via GraphQL mutation
            setSavedViews(savedViews.map(v => v.id === view.id ? view : v));
            console.log('Updating view:', view);
        },
        onDeleteView: async (viewId: string) => {
            // TODO: Delete from database via GraphQL mutation
            setSavedViews(savedViews.filter(v => v.id !== viewId));
            console.log('Deleting view:', viewId);
        }
    };

    return (<>
        <PageHeader title={`Staff`}>
            <Button color="orange" type="link"><Link href={`${adminRoot}/store/${store._id}/staff/new`}>Add Staff</Link></Button>
        </PageHeader>

        <Page>
            <ViewFilter
                config={viewConfig}
                views={savedViews}
                callbacks={viewCallbacks}
            />

            <div style={{ marginTop: 16 }}>
                <UsersList
                    loading={loading}
                    dataSource={dataArray && dataArray.edges}
                    handleDelete={handleDelete}
                    pagination={false}
                />
            </div>
        </Page>

    </>)

}

export default Staff;

// export default function Wrapper(props){
//     return (<StoreWrapper {...props} render={({ store }) => (<Staff store={store} />)} />)
// }
