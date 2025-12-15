import type { DocumentNode } from "graphql";

declare module "*.gql" {
  const Schema: DocumentNode;
  export default Schema;
}

declare module "*.graphql" {
  const Schema: DocumentNode;
  export default Schema;
}

declare module "@/*.graphql" {
  const Schema: DocumentNode;
  export default Schema;
}


// declare module '*.graphql' {
//   import { DocumentNode } from 'graphql';
//   const value: DocumentNode;
//   export default value;
// }

// declare module '*.gql' {
//   import { DocumentNode } from 'graphql';
//   const value: DocumentNode;
//   export default value;
// }

// // Support path aliases
// declare module '@/*.graphql' {
//   import { DocumentNode } from 'graphql';
//   const value: DocumentNode;
//   export default value;
// }

// declare module '@_/*.graphql' {
//   import { DocumentNode } from 'graphql';
//   const value: DocumentNode;
//   export default value;
// }



