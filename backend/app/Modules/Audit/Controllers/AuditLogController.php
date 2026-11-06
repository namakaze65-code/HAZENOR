<?php

namespace App\Modules\Audit\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;

class AuditLogController extends Controller
{
    public function index(): JsonResponse
    {
        $logs = AuditLog::where('organization_id', TenantContext::get())
            ->orderByDesc('id')
            ->paginate(25);

        return response()->json([
            'success' => true,
            'message' => 'Riwayat aktivitas organisasi berhasil diambil.',
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ]);
    }
}
