import { createElement, type ComponentType } from 'react';
import NotFoundPage from './pages/NotFoundPage.tsx';
import Start from './pages/Start.tsx';
import BookingsPage from './pages/BookingsPage.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RequireAuth from './components/RequireAuth';
import type Route from './interfaces/Route';

type RouteConfig = Omit<Route, 'element'>;
type RoutableComponent = ComponentType & { route: RouteConfig };

const pages: RoutableComponent[] = [
  NotFoundPage as RoutableComponent,
  Start as RoutableComponent,
  BookingsPage as RoutableComponent,
  LoginPage as RoutableComponent,
];

export default pages
  .map(component => {
    const route = component.route;
    const element = route.requiresAuth
      ? createElement(RequireAuth, { roles: route.roles, children: createElement(component) })
      : createElement(component);
    return {
      element,
      ...route,
    };
  })
  .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
