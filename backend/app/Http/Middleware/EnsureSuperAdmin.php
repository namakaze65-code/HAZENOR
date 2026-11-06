<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Only platform super administrators may access the Portal Administrator API.
 */
class EnsureSuperAdmin
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

        if (! $user->is_super_admin) {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak: halaman ini khusus Administrator Platform.',
            ], 403);
        }

        return $next($request);
    }
}
