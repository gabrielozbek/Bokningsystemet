import { createElement, type ComponentType } from 'react';
import NotFoundPage from './pages/NotFoundPage.tsx';
import Start from './pages/Start.tsx';
import type Route from './interfaces/Route';

type RouteConfig = Omit<Route, 'element'>;
type RoutableComponent = ComponentType & { route: RouteConfig };

const pages: RoutableComponent[] = [
  NotFoundPage as RoutableComponent,
  Start as RoutableComponent,
];

export default pages
  // map the route property of each page component to a Route
  .map(component => ({
    element: createElement(component),
    ...component.route,
  }))
  // sort by index (and if an item has no index, sort as index 0)
  .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
