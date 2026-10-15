export interface AdminAccess {
  isSuperAdmin: boolean;
  permissions: string[];
  roles: string[];
}

// Explicit route policy: unknown pages are denied rather than inheriting a broad role.
export const ADMIN_PAGES: [string, string][] = [
  ["/admin/podcasts/import-youtube", "catalog.view"],
  ["/admin/podcasts/import-rss", "catalog.create"],
  ["/admin/podcasts/new", "catalog.create"],
  ["/admin/dashboard", "dashboard.view"], ["/admin/analytics", "dashboard.view"],
  ["/admin/reviews", "reviews.view"], ["/admin/markets", "markets.view"],
  ["/admin/support", "support.view"], ["/admin/podcasts", "catalog.view"],
  ["/admin/episodes", "catalog.view"], ["/admin/editorial", "catalog.view"],
  ["/admin/collections", "catalog.view"], ["/admin/categories", "catalog.view"],
  ["/admin/creators", "users.view"], ["/admin/users", "users.view"],
  ["/admin/reports", "moderation.view"], ["/admin/claims", "claims.view"],
  ["/admin/media", "storage.view"], ["/admin/roles", "roles.view"],
  ["/admin/ads", "ads.view"], ["/admin/tarifs", "offers.view"],
  ["/admin/subscriptions", "subscriptions.view"],
  ["/admin/settings", "settings.view"], ["/admin/system", "settings.view"],
  ["/admin/audit", "audit.view"], ["/admin/prototype", "catalog.create"],
];
export function hasPermission(access: AdminAccess | undefined, permission: string) {
  return !!access && (access.isSuperAdmin || access.permissions.includes(permission));
}
export function canVisitAdmin(access: AdminAccess | undefined, path: string) {
  if (!access || (!access.isSuperAdmin && !access.permissions.length)) return false;
  if (path === "/admin" || path === "/admin/profile" || path === "/admin/notifications") return true;
  if (/^\/admin\/podcasts\/[^/]+\/episodes\/new\/?$/.test(path)) return hasPermission(access,"catalog.create");
  if (/^\/admin\/podcasts\/[^/]+\/edit\/?$/.test(path)) return hasPermission(access,"catalog.edit");
  const rule = ADMIN_PAGES.find(([prefix]) => path === prefix || path.startsWith(prefix + "/"));
  return !!rule && hasPermission(access,rule[1]);
}
export function firstAdminPage(access: AdminAccess | undefined) {
  // Keep the start page stable; prefer support for workers whose only task is assistance.
  const paths=["/admin/dashboard","/admin/support","/admin/podcasts","/admin/users",...ADMIN_PAGES.map(([p])=>p)];
  return paths.find(p=>canVisitAdmin(access,p)) || "/";
}
