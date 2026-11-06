<?php

namespace App\Http\Middleware;

use App\Models\OrganizationMember;
use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ResolveOrganizationContext
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (! $user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $requestedOrgId = $request->header('X-Organization-Id');

        $membershipQuery = OrganizationMember::withoutGlobalScope('organization_isolation')
            ->with('role')
            ->where('user_id', $user->id)
            ->where('status', 'ACTIVE');

        if ($requestedOrgId) {
            $membershipQuery->where('organization_id', $requestedOrgId);
        }

        $membership = $membershipQuery->first();

        // Also check tenant_user_links if not a staff/owner member (Portal Penyewa)
        if (! $membership) {
            $tenantLinkQuery = DB::table('tenant_user_links')
                ->where('user_id', $user->id);

            if ($requestedOrgId) {
                $tenantLinkQuery->where('organization_id', $requestedOrgId);
            }

            $tenantLink = $tenantLinkQuery->first();

            if ($tenantLink) {
                // Expose the linked tenant record so tenant endpoints only return the tenant's own data
                $request->attributes->set('tenant_id', $tenantLink->tenant_id);

                try {
                    TenantContext::set($tenantLink->organization_id, 'TENANT');
                    return $next($request);
                } finally {
                    TenantContext::clear();
                }
            }
        }

        if (! $membership) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: Anda bukan anggota aktif organisasi ini.',
            ], 403);
        }

        try {
            TenantContext::set($membership->organization_id, $membership->role?->code);
            $response = $next($request);
            $requestId = $request->header('X-Request-Id') ?: (string) \Illuminate\Support\Str::uuid();
            $response->headers->set('X-Request-Id', $requestId);
            return $response;
        } finally {
            TenantContext::clear();
        }
    }
}
