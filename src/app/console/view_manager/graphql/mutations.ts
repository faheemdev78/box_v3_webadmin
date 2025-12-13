import { gql } from '@apollo/client';

export const CREATE_ENTITY_CONFIG = gql`
  mutation CreateEntityConfig($input: CreateEntityConfigInput!) {
    createEntityConfig(input: $input) {
      _id
      entityType
      entityLabel
      success {
        message
      }
      error {
        message
      }
    }
  }
`;

export const UPDATE_ENTITY_CONFIG = gql`
  mutation UpdateEntityConfig($input: UpdateEntityConfigInput!) {
    updateEntityConfig(input: $input) {
      _id
      entityType
      entityLabel
      success {
        message
      }
      error {
        message
      }
    }
  }
`;

export const DELETE_ENTITY_CONFIG = gql`
  mutation DeleteEntityConfig($_id: ID!) {
    deleteEntityConfig(_id: $_id) {
      success {
        message
      }
      error {
        message
      }
    }
  }
`;
