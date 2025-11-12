import { gql } from '@apollo/client';

export const GET_ENTITY_CONFIGS = gql`
  query GetEntityConfigs {
    entityConfigs {
      _id
      entityType
      entityLabel
      entityLabelSingular
      fields {
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
      availableColumns {
        key
        label
        visible
        sortable
        width
        frozen
        group
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
  }
`;

export const GET_ENTITY_CONFIG = gql`
  query GetEntityConfig($entityType: String!) {
    entityConfig(entityType: $entityType) {
      _id
      entityType
      entityLabel
      entityLabelSingular
      fields {
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
      availableColumns {
        key
        label
        visible
        sortable
        width
        frozen
        group
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
      error {
        message
      }
    }
  }
`;
