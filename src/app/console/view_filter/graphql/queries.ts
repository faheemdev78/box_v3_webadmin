import { gql } from '@apollo/client';

/**
 * Fragment for Filter Condition
 */
export const FILTER_CONDITION_FRAGMENT = gql`
  fragment FilterConditionFields on FilterCondition {
    id
    field
    operator
    value
    isChangeable
  }
`;

/**
 * Fragment for Filter Group
 */
export const FILTER_GROUP_FRAGMENT = gql`
  fragment FilterGroupFields on FilterGroup {
    id
    logic
    conditions {
      ...FilterConditionFields
    }
  }
  ${FILTER_CONDITION_FRAGMENT}
`;

/**
 * Fragment for Quick Filter
 */
export const QUICK_FILTER_FRAGMENT = gql`
  fragment QuickFilterFields on QuickFilter {
    field
    label
    options {
      label
      value
    }
    currentValue
  }
`;

/**
 * Fragment for Saved View
 */
export const SAVED_VIEW_FRAGMENT = gql`
  fragment SavedViewFields on SavedView {
    _id
    name
    description
    entityType
    filters {
      ...FilterConditionFields
    }
    filterGroups {
      ...FilterGroupFields
    }
    quickFilters {
      ...QuickFilterFields
    }
    columns
    sort {
      field
      direction
    }
    visibility
    owner
    isPinned
    isDefault
    usageCount
    lastUsedAt
    createdAt
    updatedAt
  }
  ${FILTER_CONDITION_FRAGMENT}
  ${FILTER_GROUP_FRAGMENT}
  ${QUICK_FILTER_FRAGMENT}
`;

/**
 * Fragment for Field Definition
 */
export const FIELD_DEFINITION_FRAGMENT = gql`
  fragment FieldDefinitionFields on FieldDefinition {
    key
    label
    type
    group
    operators
    options {
      label
      value
    }
    isFilterable
    isSortable
    isSearchable
    dataPath
  }
`;

/**
 * Fragment for Column Definition
 */
export const COLUMN_DEFINITION_FRAGMENT = gql`
  fragment ColumnDefinitionFields on ColumnDefinition {
    key
    label
    visible
    sortable
    width
    frozen
    group
  }
`;

/**
 * Fragment for Entity Config
 */
export const ENTITY_CONFIG_FRAGMENT = gql`
  fragment EntityConfigFields on EntityConfig {
    _id
    entityType
    entityLabel
    entityLabelSingular
    fields {
      ...FieldDefinitionFields
    }
    availableColumns {
      ...ColumnDefinitionFields
    }
    defaultColumns
    defaultSort {
      field
      direction
    }
    rowKey
    isActive
    createdAt
    updatedAt
  }
  ${FIELD_DEFINITION_FRAGMENT}
  ${COLUMN_DEFINITION_FRAGMENT}
`;

/**
 * Get all saved views for an entity
 */
export const GET_SAVED_VIEWS = gql`
  query GetSavedViews($entityType: String!, $limit: Int, $page: Int, $visibility: String) {
    savedViews(entityType: $entityType, limit: $limit, page: $page, visibility: $visibility) {
      edges {
        ...SavedViewFields
      }
      pagination {
        totalDocs
        totalPages
        page
        limit
        hasNextPage
        hasPrevPage
      }
      error {
        message
      }
    }
  }
  ${SAVED_VIEW_FRAGMENT}
`;

/**
 * Get a single saved view by ID
 */
export const GET_SAVED_VIEW = gql`
  query GetSavedView($_id: ID!) {
    savedView(_id: $_id) {
      ...SavedViewFields
      error {
        message
      }
    }
  }
  ${SAVED_VIEW_FRAGMENT}
`;

/**
 * Get entity configuration
 */
export const GET_ENTITY_CONFIG = gql`
  query GetEntityConfig($entityType: String!) {
    entityConfig(entityType: $entityType) {
      ...EntityConfigFields
      error {
        message
      }
    }
  }
  ${ENTITY_CONFIG_FRAGMENT}
`;

/**
 * Get all entity configurations
 */
export const GET_ENTITY_CONFIGS = gql`
  query GetEntityConfigs {
    entityConfigs {
      ...EntityConfigFields
    }
  }
  ${ENTITY_CONFIG_FRAGMENT}
`;

/**
 * Get filtered data for an entity
 */
export const GET_FILTERED_DATA = gql`
  query GetFilteredData(
    $entityType: String!
    $viewId: ID
    $filters: [FilterConditionInput!]
    $filterGroups: [FilterGroupInput!]
    $sort: SortConfigInput
    $limit: Int
    $page: Int
    $searchTerm: String
  ) {
    filteredData(
      entityType: $entityType
      viewId: $viewId
      filters: $filters
      filterGroups: $filterGroups
      sort: $sort
      limit: $limit
      page: $page
      searchTerm: $searchTerm
    ) {
      edges
      totalCount
      pagination {
        totalDocs
        totalPages
        page
        limit
        hasNextPage
        hasPrevPage
      }
      error {
        message
      }
    }
  }
`;