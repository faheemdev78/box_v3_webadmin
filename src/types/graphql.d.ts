import type { DocumentNode } from 'graphql';

declare module '*.graphql' {
  import { DocumentNode } from 'graphql';
  const Schema: DocumentNode;
  export = Schema;
}

// You might also need this if you use .gql extension
declare module '*.gql' {
  import { DocumentNode } from 'graphql';
  const Schema: DocumentNode;
  export = Schema;
}
