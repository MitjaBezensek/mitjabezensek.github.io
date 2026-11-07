import type { APIRoute } from 'astro';
import icon from '../assets/site-icon.svg?raw';

export const GET: APIRoute = () => new Response(icon, {
  headers: { 'Content-Type': 'image/svg+xml; charset=utf-8' },
});
