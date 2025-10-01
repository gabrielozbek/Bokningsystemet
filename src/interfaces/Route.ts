import type { LoaderFunction } from 'react-router-dom';
import type { JSX } from 'react';

export default interface Route {
  element: JSX.Element;
  path: string;
  loader?: LoaderFunction;
  menuLabel?: string;
  index?: number;
  parent?: string;
}
