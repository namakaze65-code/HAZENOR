<?php

namespace App\Http\Middleware;

use App\Support\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Blocks tenant (penyewa) accounts from owner/staff endpoints.
 * Must run after ResolveOrganizationContext.
 */
class EnsureStaffRole
{
    public function handle(Request $request, Closure $next): Response
    {
        $role = TenantContext::role();

        if ($role === null || $role === 'TENANT') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: fitur ini khusus pemilik dan staf pengelola.',
            ], 403);
        }

        return $next($request);
    }
}
