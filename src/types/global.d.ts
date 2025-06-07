declare module 'react' {
  import * as React from 'react';
  export = React;
  export as namespace React;
}

declare module 'react-dom/client' {
  import * as ReactDOMClient from 'react-dom/client';
  export = ReactDOMClient;
  export as namespace ReactDOMClient;
}

declare module 'react-router-dom' {
  import * as ReactRouterDOM from 'react-router-dom';
  export = ReactRouterDOM;
  export as namespace ReactRouterDOM;
}

declare module 'lucide-react' {
  import * as LucideReact from 'lucide-react';
  export = LucideReact;
  export as namespace LucideReact;
}

declare module '@supabase/supabase-js' {
  import * as SupabaseJS from '@supabase/supabase-js';
  export = SupabaseJS;
  export as namespace SupabaseJS;
}

declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
} 