declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.tsx?raw' {

  const content: string;

  export default content;

}

declare module '*.mdx' {
  import { ComponentType } from 'react';
  const component: ComponentType<any>;
  export default component;
}
