declare module "*.svg" {
  const content: any;
  export default content;
} 

declare module '@components/*' {
  import { FC } from 'react';
  const Component: FC<any>;
  export default Component;
}

declare module '@pages/*' {
  import { FC } from 'react';
  const Page: FC<any>;
  export default Page;
}