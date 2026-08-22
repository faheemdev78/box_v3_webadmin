'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Button, Card, Space, Tag, Typography, message } from 'antd';
import { useLazyQuery, useQuery } from '@apollo/client/react';
import { Table } from '../table';
import { defaultPagination } from '@/configs';
import { catchApolloError, checkApolloRequestErrors } from '@/lib/utill_apollo';
import LIST_DATA from '@/graphql/order/ordersQuery.graphql';
import SAVED_FILTERS from '@/graphql/dynamic_filters/dynamicFilters.graphql';
import { ALL_ORDERS_TAB_ID, type FilterField, type FilterGroup, type SavedDynamicFilter } from './types';
import { getOrdersFilterFields } from './ordersFilterConfig';
import { cloneJson, sameTree, stripTypename } from './clone';
import { isTreeComplete, toQueryGroups, treeIncompleteReason } from './completeness';
import { FilterTabs } from './FilterTabs';
import { FilterBar } from './FilterBar';
import { FilterEditor } from './FilterEditor';
import { FilterManager } from './FilterManager';

const { Title, Text } = Typography;

type ChangeKind = 'text' | 'number' | 'id' | 'select' | 'date' | 'operator' | 'logic';

type Props = {
  entityType?: string;
  storeId: string;
  contextFilter?: Record<string, any>;
  customColumns?: Record<string, any>;
  reloadToken?: number;
};

const DEFAULT_COLUMNS = [
  { title: 'Serial', key: 'serial', dataIndex: 'serial' },
  { title: 'Customer', key: 'customer', dataIndex: ['customer', 'name'] },
  { title: 'Picker', key: 'picker', dataIndex: ['processing_stages', 'picking'] },
  { title: 'Store', key: 'store', dataIndex: 'store' },
  { title: 'Order', key: 'current_order', dataIndex: 'current_order' },
  { title: 'Slot', key: 'delivery_slot', dataIndex: 'delivery_slot' },
  { title: 'Stage', key: 'current_stage', dataIndex: 'current_stage', width: 130 },
  { title: 'Status', key: 'status.order', dataIndex: ['status', 'order'], width: 130 },
  { title: 'Created', key: 'createdAt', dataIndex: 'createdAt', width: 110 },
  { title: 'Actions', key: 'actions', dataIndex: 'actions', width: 120, fixed: 'right' },
];

function normalizeSaved(view: any): SavedDynamicFilter {
  const cleaned = stripTypename(view) as SavedDynamicFilter;
  return {
    ...cleaned,
    filterGroups: (cleaned.filterGroups || []).map((group) => ({
      ...group,
      logic: (group.logic as any) || 'AND',
      joinLogic: (group.joinLogic as any) || 'AND',
      conditions: (group.conditions || []).map((condition) => ({
        ...condition,
        id: condition.id || `c_${Math.random().toString(36).slice(2, 8)}`,
        field: condition.field || '',
        operator: condition.operator || '',
        value: condition.value ?? null,
      })),
    })),
  };
}

export function OrderFilters({
  entityType = 'orders',
  storeId,
  customColumns,
  reloadToken = 0,
}: Props) {
  const fields: FilterField[] = useMemo(() => getOrdersFilterFields(), []);
  const [activeId, setActiveId] = useState(ALL_ORDERS_TAB_ID);
  const [draftGroups, setDraftGroups] = useState<FilterGroup[]>([]);
  const [savedSnapshot, setSavedSnapshot] = useState<FilterGroup[]>([]);
  const [queryGroups, setQueryGroups] = useState<FilterGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [builderOpen, setBuilderOpen] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [prefillCreate, setPrefillCreate] = useState(false);
  const [pagination, setPagination] = useState({ ...defaultPagination });
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [fatalError, setFatalError] = useState<string | false>(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const didInitDefault = useRef(false);

  const { data: savedData, loading: viewsLoading, refetch: refetchViews } = useQuery<any>(SAVED_FILTERS, {
    variables: { entityType, storeId },
    skip: !entityType || !storeId,
    fetchPolicy: 'network-only',
  });

  const views: SavedDynamicFilter[] = useMemo(() => (
    (savedData?.dynamicFilters || []).filter((item: any) => item && !item.error).map(normalizeSaved)
  ), [savedData]);

  const pinned = views.filter((view) => view.isPinned);
  const activeView = views.find((view) => view._id === activeId) || null;
  const dirty = !sameTree(draftGroups, savedSnapshot);
  const incompleteReason = treeIncompleteReason(draftGroups, fields);
  const treeComplete = isTreeComplete(draftGroups, fields);

  const [ordersQuery, { loading }] = useLazyQuery<any>(LIST_DATA, { fetchPolicy: 'network-only' });

  const applyDraft = (next: FilterGroup[], kind: ChangeKind) => {
    setDraftGroups(next);
    if (!isTreeComplete(next, fields)) return;
    const payload = toQueryGroups(next) as FilterGroup[];
    if (kind === 'text' || kind === 'number') {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setQueryGroups(payload), 300);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQueryGroups(payload);
  };

  const loadTree = (groups: FilterGroup[], id: string) => {
    const cloned = cloneJson(groups || []);
    setActiveId(id);
    setSavedSnapshot(cloneJson(cloned));
    setDraftGroups(cloneJson(cloned));
    if (isTreeComplete(cloned, fields)) setQueryGroups(toQueryGroups(cloned) as FilterGroup[]);
    setBuilderOpen(false);
    setPagination((prev) => ({ ...prev, current: 1 }));
  };

  const selectAll = () => loadTree([], ALL_ORDERS_TAB_ID);

  const selectView = (view: SavedDynamicFilter) => {
    loadTree(view.filterGroups || [], view._id);
  };

  useEffect(() => {
    if (didInitDefault.current || viewsLoading) return;
    didInitDefault.current = true;
    const defaultView = views.find((view) => view.isDefault);
    if (defaultView) selectView(defaultView);
  }, [viewsLoading, views]);

  useEffect(() => {
    if (activeId === ALL_ORDERS_TAB_ID) return;
    if (!viewsLoading && views.length >= 0 && !views.some((view) => view._id === activeId)) {
      selectAll();
    }
  }, [views, viewsLoading, activeId]);

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchTerm]);

  const fetchData = async (page = pagination.current, pageSize = pagination.pageSize) => {
    if (!storeId) return;
    if (!isTreeComplete(queryGroups, fields)) return;
    setFatalError(false);

    const result = await ordersQuery({
      variables: {
        limit: pageSize,
        page,
        filter: JSON.stringify({}),
        others: JSON.stringify({}),
        _id_store: storeId,
        filterGroups: queryGroups,
        searchTerm: debouncedSearch || null,
      },
    })
      .then((r) => checkApolloRequestErrors({ results: r, allowEmpty: true, parseReturn: (rr: any) => rr?.data?.ordersQuery }))
      .catch(catchApolloError);

    if (result?.error) {
      setFatalError(result.error.message);
      message.error(result.error.message);
      return;
    }

    setPagination((prev) => ({
      ...prev,
      current: result?.pagination?.page || page,
      total: result?.pagination?.totalDocs || 0,
      pageSize: result?.pagination?.limit || pageSize,
    }));
    setDataSource(result?.edges || []);
  };

  useEffect(() => {
    fetchData(1, pagination.pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, JSON.stringify(queryGroups), debouncedSearch, reloadToken]);

  const columns = DEFAULT_COLUMNS.map((column) => ({
    ...column,
    ...(customColumns?.[column.key] || {}),
  }));

  return (
    <>
      <Card
        title={<Space>
          <Title level={3} style={{ margin: 0 }}>Orders</Title>
          {!loading && <Tag color="green">{pagination.total || 0} orders found</Tag>}
        </Space>}
        extra={<Space>
          <Button onClick={() => fetchData()} loading={loading}>Refresh</Button>
          <Button onClick={() => { setPrefillCreate(true); setManagerOpen(true); }} disabled={!treeComplete}>
            Save as new filter
          </Button>
        </Space>}
        styles={{ body: { padding: 12 } }}
      >
        <FilterTabs
          activeId={activeId}
          pinned={pinned}
          dirty={dirty}
          onChange={(id) => {
            if (id === ALL_ORDERS_TAB_ID) selectAll();
            else {
              const view = views.find((item) => item._id === id);
              if (view) selectView(view);
            }
          }}
          onOpenManager={() => { setPrefillCreate(false); setManagerOpen(true); }}
        />

        <FilterBar
          fields={fields}
          groups={draftGroups}
          searchTerm={searchTerm}
          onSearch={setSearchTerm}
          dirty={dirty}
          incomplete={!treeComplete}
          incompleteReason={incompleteReason}
          onReset={() => loadTree(savedSnapshot, activeId)}
          extra={activeView ? <Text type="secondary">{activeView.name}</Text> : null}
          onRemoveChip={(conditionId) => {
            applyDraft(draftGroups
              .map((group) => ({ ...group, conditions: group.conditions.filter((condition) => condition.id !== conditionId) }))
              .filter((group) => group.conditions.length > 0), 'operator');
          }}
          builderOpen={builderOpen}
          onToggleBuilder={() => setBuilderOpen((open) => !open)}
          builderContent={(
            <FilterEditor
              compact
              fields={fields}
              groups={draftGroups}
              onChange={applyDraft}
              showDone
              onDone={() => setBuilderOpen(false)}
            />
          )}
        />

        {fatalError && <Alert title="Error" description={fatalError} type="error" showIcon style={{ marginBottom: 12 }} />}

        <Table
          loading={loading}
          columns={columns}
          dataSource={dataSource}
          pagination={pagination}
          scroll={{ x: 1200 }}
          rowKey="_id"
          onChange={(next: any) => {
            setPagination((prev) => ({ ...prev, current: next.current, pageSize: next.pageSize }));
            fetchData(next.current, next.pageSize);
          }}
        />
      </Card>

      <FilterManager
        open={managerOpen}
        onClose={() => setManagerOpen(false)}
        entityType={entityType}
        storeId={storeId}
        fields={fields}
        views={views}
        draftGroups={draftGroups}
        onRefetch={refetchViews}
        onSelect={selectView}
        prefillCreate={prefillCreate}
      />
    </>
  );
}
