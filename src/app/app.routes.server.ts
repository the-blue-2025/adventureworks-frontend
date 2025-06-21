import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: '',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'dashboard',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'persons',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'vendors',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'ship-methods',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'purchase-orders',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'purchase-orders/create',
    renderMode: RenderMode.Prerender
  },
  {
    path: 'purchase-orders/:id/edit',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve([])
  },
  {
    path: 'purchase-orders/:id/details',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => Promise.resolve([])
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
