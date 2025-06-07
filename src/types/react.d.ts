declare module 'react' {
  export = React;
  export as namespace React;
}

declare module 'react/jsx-runtime' {
  export namespace JSX {
    interface Element {}
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
  export function jsx(type: any, props: any): any;
  export function jsxs(type: any, props: any): any;
}

declare module 'react-dom/client' {
  import { ReactNode } from 'react';
  export function createRoot(container: Element | null): {
    render(children: ReactNode): void;
  };
} 