<?php

namespace App\Modules\Complaint\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Complaint;
use App\Models\ComplaintMessage;
use App\Models\ComplaintStatusHistory;
use App\Models\Tenant;
use App\Models\Unit;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ComplaintController extends Controller
{
    public function index(): JsonResponse
    {
        $complaints = Complaint::with(['tenant', 'unit.property', 'statusHistory', 'messages'])
            ->latest()
            ->paginate(20);

        return response()->json([
            'success' => true,
            'message' => 'Daftar keluhan berhasil diambil.',
            'data' => $complaints->items(),
            'meta' => [
                'current_page' => $complaints->currentPage(),
                'per_page' => $complaints->perPage(),
                'total' => $complaints->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id' => ['required', 'uuid'],
            'unit_id' => ['required', 'uuid'],
            'ticket_number' => ['required', 'string', 'max:80'],
            'title' => ['required', 'string', 'max:180'],
            'description' => ['required', 'string'],
            'category' => ['nullable', 'string', 'max:50'],
            'priority' => ['required', Rule::in(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])],
        ]);

        $tenant = Tenant::findOrFail($validated['tenant_id']);
        $unit = Unit::findOrFail($validated['unit_id']);

        return DB::transaction(function () use ($request, $validated, $tenant, $unit) {
            $complaint = Complaint::create([
                'tenant_id' => $tenant->id,
                'unit_id' => $unit->id,
                'ticket_number' => $validated['ticket_number'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'category' => $validated['category'] ?? 'UMUM',
                'priority' => $validated['priority'],
                'status' => 'NEW',
            ]);

            ComplaintStatusHistory::create([
                'complaint_id' => $complaint->id,
                'old_status' => null,
                'new_status' => 'NEW',
                'changed_by' => $request->user()->id,
                'note' => 'Tiket keluhan dibuat.',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tiket keluhan berhasil dibuat.',
                'data' => $complaint->load(['tenant', 'unit', 'statusHistory']),
            ], 201);
        });
    }

    public function updateStatus(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['NEW', 'REVIEWED', 'IN_PROGRESS', 'WAITING_TENANT', 'RESOLVED', 'CLOSED'])],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        return DB::transaction(function () use ($request, $id, $validated) {
            $complaint = Complaint::lockForUpdate()->findOrFail($id);
            $oldStatus = $complaint->status;

            $complaint->update([
                'status' => $validated['status'],
                'resolved_at' => in_array($validated['status'], ['RESOLVED', 'CLOSED'], true) ? now() : $complaint->resolved_at,
            ]);

            ComplaintStatusHistory::create([
                'complaint_id' => $complaint->id,
                'old_status' => $oldStatus,
                'new_status' => $validated['status'],
                'changed_by' => $request->user()->id,
                'note' => $validated['note'] ?? "Status diubah dari {$oldStatus} ke {$validated['status']}.",
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Status tiket keluhan berhasil diperbarui.',
                'data' => $complaint->fresh(['tenant', 'unit', 'statusHistory', 'messages']),
            ]);
        });
    }

    public function storeMessage(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $complaint = Complaint::findOrFail($id);

        $msg = ComplaintMessage::create([
            'complaint_id' => $complaint->id,
            'sender_user_id' => $request->user()->id,
            'message' => $validated['message'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pesan berhasil dikirim ke tiket keluhan.',
            'data' => $msg,
        ], 201);
    }

    public function show(string $id): JsonResponse
    {
        $complaint = Complaint::with(['tenant', 'unit.property', 'statusHistory', 'messages'])
            ->findOrFail($id);

        $attachments = DB::table('complaint_attachments')
            ->where('organization_id', $complaint->organization_id)
            ->where('complaint_id', $complaint->id)
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Detail keluhan berhasil diambil.',
            'data' => [
                'complaint' => $complaint,
                'attachments' => $attachments,
            ],
        ]);
    }

    public function storeAttachment(Request $request, string $id): JsonResponse
    {
        $validated = $request->validate([
            'file_path' => ['required', 'string', 'max:500'],
            'original_filename' => ['nullable', 'string', 'max:255'],
            'mime_type' => ['required', 'string', 'max:100'],
            'file_size' => ['required', 'integer', 'min:1', 'max:10485760'],
        ]);

        $complaint = Complaint::findOrFail($id);
        $attachmentId = (string) \Illuminate\Support\Str::uuid();

        DB::table('complaint_attachments')->insert([
            'id' => $attachmentId,
            'organization_id' => $complaint->organization_id,
            'complaint_id' => $complaint->id,
            'storage_key' => $validated['file_path'],
            'original_filename' => $validated['original_filename'] ?? basename($validated['file_path']),
            'mime_type' => $validated['mime_type'],
            'size_bytes' => $validated['file_size'],
            'uploaded_by' => $request->user()->id,
            'created_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Lampiran keluhan berhasil disimpan.',
            'data' => [
                'id' => $attachmentId,
                'complaint_id' => $complaint->id,
                'storage_key' => $validated['file_path'],
                'mime_type' => $validated['mime_type'],
                'size_bytes' => $validated['file_size'],
            ],
        ], 201);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        return DB::transaction(function () use ($request, $id) {
            $complaint = Complaint::lockForUpdate()->findOrFail($id);
            $oldStatus = $complaint->status;

            $complaint->update([
                'status' => 'CLOSED',
                'resolved_at' => $complaint->resolved_at ?? now(),
            ]);

            ComplaintStatusHistory::create([
                'complaint_id' => $complaint->id,
                'old_status' => $oldStatus,
                'new_status' => 'CLOSED',
                'changed_by' => $request->user()->id,
                'note' => $request->input('note', 'Keluhan ditutup oleh pengelola.'),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Tiket keluhan berhasil ditutup.',
                'data' => $complaint->fresh(['tenant', 'unit', 'statusHistory', 'messages']),
            ]);
        });
    }
}
