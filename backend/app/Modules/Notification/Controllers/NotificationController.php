<?php

namespace App\Modules\Notification\Controllers;

use App\Http\Controllers\Controller;
use App\Models\NotificationRecord;
use App\Models\Organization;
use App\Support\TenantContext;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(): JsonResponse
    {
        $notifications = NotificationRecord::with('logs')
            ->orderByDesc('created_at')
            ->paginate(25);

        return response()->json([
            'success' => true,
            'message' => 'Daftar notifikasi dan log pengiriman berhasil diambil.',
            'data' => $notifications->items(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function markAsRead(string $id): JsonResponse
    {
        $notif = NotificationRecord::findOrFail($id);
        $notif->update(['read_at' => now()]);

        return response()->json([
            'success' => true,
            'message' => 'Notifikasi ditandai sudah dibaca.',
            'data' => $notif,
        ]);
    }

    public function preferences(Request $request): JsonResponse
    {
        $org = Organization::findOrFail(TenantContext::get());
        $userId = $request->user()->id;
        $prefs = $org->settings['notification_preferences'][$userId] ?? [
            'whatsapp_enabled' => true,
            'email_enabled' => true,
            'in_app_enabled' => true,
        ];

        return response()->json([
            'success' => true,
            'message' => 'Preferensi notifikasi berhasil diambil.',
            'data' => $prefs,
        ]);
    }

    public function updatePreferences(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'whatsapp_enabled' => ['required', 'boolean'],
            'email_enabled' => ['required', 'boolean'],
            'in_app_enabled' => ['required', 'boolean'],
        ]);

        $org = Organization::findOrFail(TenantContext::get());
        $settings = $org->settings ?? [];
        $settings['notification_preferences'][$request->user()->id] = $validated;
        $org->update(['settings' => $settings]);

        return response()->json([
            'success' => true,
            'message' => 'Preferensi notifikasi berhasil disimpan.',
            'data' => $validated,
        ]);
    }
}
