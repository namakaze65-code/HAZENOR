<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only linked tenant (penyewa) accounts may access the Portal Penyewa API.
 * Must run after ResolveOrganizationContext.
 */
class EnsureTenantRole
{
    public function handle(Request $request, Closure $next): Response
    {
        if (TenantContext::role() !== 'TENANT' || ! $request->attributes->get('tenant_id')) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: fitur ini khusus akun penyewa.',
            ], 403);
        }

        return $next($request);
    }
}
