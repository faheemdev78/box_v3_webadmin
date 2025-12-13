import { gql } from '@apollo/client';
import { SAVED_VIEW_FRAGMENT, ENTITY_CONFIG_FRAGMENT } from './queries';

/**
 * Create a new saved view
 */
export const CREATE_SAVED_VIEW = gql`
  mutation CreateSavedView($input: CreateSavedViewInput!) {
    createSavedView(input: $input) {
      ...SavedViewFields
      success {
        message
      }
      error {
        message
      }
    }
  }
  ${SAVED_VIEW_FRAGMENT}
`;

/**
 * Update a saved view
 */
export const UPDATE_SAVED_VIEW = gql`
  mutation UpdateSavedView($input: UpdateSavedViewInput!) {
    updateSavedView(input: $input) {
      ...SavedViewFields
      success {
        message
      }
      error {
        message
      }
    }
  }
  ${SAVED_VIEW_FRAGMENT}
`;

/**
 * Delete a saved view
 */
export const DELETE_SAVED_VIEW = gql`
  mutation DeleteSavedView($_id: ID!) {
    deleteSavedView(_id: $_id) {
      success {
        message
      }
      error {
        message
      }
    }
  }
`;

/**
 * Duplicate a saved view
 */
export const DUPLICATE_SAVED_VIEW = gql`
  mutation DuplicateSavedView($_id: ID!, $name: String) {
    duplicateSavedView(_id: $_id, name: $name) {
      ...SavedViewFields
      success {
        message
      }
      error {
        message
      }
    }
  }
  ${SAVED_VIEW_FRAGMENT}
`;

/**
 * Pin/Unpin a saved view
 */
export const PIN_SAVED_VIEW = gql`
  mutation PinSavedView($_id: ID!, $isPinned: Boolean!) {
    pinSavedView(_id: $_id, isPinned: $isPinned) {
      ...SavedViewFields
      success {
        message
      }
      error {
        message
      }
    }
  }
  ${SAVED_VIEW_FRAGMENT}
`;

/**
 * Update view usage tracking
 */
export const UPDATE_VIEW_USAGE = gql`
  mutation UpdateViewUsage($_id: ID!) {
    updateViewUsage(_id: $_id) {
      _id
      usageCount
      lastUsedAt
    }
  }
`;

/**
 * Create entity configuration
 */
export const CREATE_ENTITY_CONFIG = gql`
  mutation CreateEntityConfig($input: CreateEntityConfigInput!) {
    createEntityConfig(input: $input) {
      ...EntityConfigFields
      success {
        message
      }
      error {
        message
      }
    }
  }
  ${ENTITY_CONFIG_FRAGMENT}
`;

/**
 * Update entity configuration
 */
export const UPDATE_ENTITY_CONFIG = gql`
  mutation UpdateEntityConfig($input: UpdateEntityConfigInput!) {
    updateEntityConfig(input: $input) {
      ...EntityConfigFields
      success {
        message
      }
      error {
        message
      }
    }
  }
  ${ENTITY_CONFIG_FRAGMENT}
`;

/**
 * Delete entity configuration
 */
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
