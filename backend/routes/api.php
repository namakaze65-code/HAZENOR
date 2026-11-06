<?php

use App\Http\Middleware\EnsureStaffRole;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\EnsureTenantRole;
use App\Http\Middleware\ResolveOrganizationContext;
use App\Modules\Audit\Controllers\AuditLogController;
use App\Modules\Auth\Controllers\AuthController;
use App\Modules\Billing\Controllers\InvoiceController;
use App\Modules\Complaint\Controllers\ComplaintController;
use App\Modules\Lease\Controllers\LeaseController;
use App\Modules\Notification\Controllers\NotificationController;
use App\Modules\Organization\Controllers\BankAccountController;
use App\Modules\Organization\Controllers\OrganizationController;
use App\Modules\Payment\Controllers\PaymentController;
use App\Modules\Property\Controllers\PropertyController;
use App\Modules\Report\Controllers\ReportController;
use App\Modules\Subscription\Controllers\SuperAdminController;
use App\Modules\Tenant\Controllers\TenantController;
use App\Modules\Tenant\Controllers\TenantPortalController;
use App\Modules\Unit\Controllers\UnitController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public Auth, Password Reset & Invitation Endpoints (Section 8.1)
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);
    Route::post('/auth/accept-invitation', [AuthController::class, 'acceptInvitation']);

    // Idempotent Payment Gateway Webhook Endpoint (PAY-06, PAY-07)
    Route::post('/webhooks/payments/{provider}', [PaymentController::class, 'handleWebhook']);

    // Signed Temporary URL download route (10-minute expiration)
    Route::get('/files/payment-proofs/{org}/{payment}', function (Request $request, string $org, string $payment) {
        if (! $request->hasValidSignature()) {
            return response()->json([
                'success' => false,
                'message' => 'Tautan dokumen sudah kedaluwarsa atau tidak valid.',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'message' => 'Akses dokumen privat terverifikasi via Signed Temporary URL.',
            'data' => [
                'organization_id' => $org,
                'payment_id' => $payment,
                'verified_signature' => true,
            ],
        ]);
    })->name('files.payment-proof.download');

    // Super Admin Endpoints (Section 8.7) — only authenticated platform super administrators
    Route::middleware(['auth:sanctum', EnsureSuperAdmin::class])->group(function () {
        Route::get('/admin/dashboard', [SuperAdminController::class, 'dashboard']);
        Route::get('/admin/organizations', [SuperAdminController::class, 'organizations']);
        Route::get('/admin/users', [SuperAdminController::class, 'users']);
        Route::get('/admin/subscriptions', [SuperAdminController::class, 'subscriptions']);
        Route::patch('/admin/organizations/{id}/status', [SuperAdminController::class, 'updateOrganizationStatus']);
        Route::get('/admin/audit-logs', [SuperAdminController::class, 'auditLogs']);
    });

    // Authenticated Endpoints
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/switch-organization', [AuthController::class, 'switchOrganization']);
        Route::get('/organizations', [OrganizationController::class, 'index']);

        // Organization-Scoped Endpoints (Protected by ResolveOrganizationContext + PostgreSQL RLS)
        Route::middleware(ResolveOrganizationContext::class)->group(function () {
            Route::get('/auth/me', [AuthController::class, 'me']);

            // Portal Penyewa — tenant accounts only, always limited to the tenant's own records
            Route::middleware(EnsureTenantRole::class)->prefix('tenant-portal')->group(function () {
                Route::get('/overview', [TenantPortalController::class, 'overview']);
                Route::get('/invoices', [TenantPortalController::class, 'invoices']);
                Route::post('/invoices/{id}/payments', [TenantPortalController::class, 'submitPayment']);
                Route::get('/complaints', [TenantPortalController::class, 'complaints']);
                Route::post('/complaints', [TenantPortalController::class, 'storeComplaint']);
                Route::post('/complaints/{id}/messages', [TenantPortalController::class, 'storeComplaintMessage']);
                Route::post('/complaints/{id}/attachments', [TenantPortalController::class, 'storeComplaintAttachment']);
            });

            // Owner & Staff Endpoints — tenant accounts are rejected with 403
            Route::middleware(EnsureStaffRole::class)->group(function () {

            // Organization Profile, Members (RBAC), Invitations & Bank Accounts (Section 8.2)
            Route::get('/organizations/current', [OrganizationController::class, 'current']);
            Route::put('/organizations/current', [OrganizationController::class, 'updateCurrent']);
            Route::get('/organizations/members', [OrganizationController::class, 'members']);
            Route::post('/organizations/invitations', [OrganizationController::class, 'inviteStaff']);
            Route::get('/organizations/invitations', [OrganizationController::class, 'invitations']);
            Route::delete('/organizations/invitations/{id}', [OrganizationController::class, 'cancelInvitation']);
            Route::patch('/organizations/members/{id}', [OrganizationController::class, 'updateMember']);
            Route::get('/organizations/bank-accounts', [BankAccountController::class, 'index']);
            Route::post('/organizations/bank-accounts', [BankAccountController::class, 'store']);
            Route::post('/organizations/reset-data', [OrganizationController::class, 'resetOperationalData']);

            // Properties & Units (Section 8.3)
            Route::get('/properties', [PropertyController::class, 'index']);
            Route::post('/properties', [PropertyController::class, 'store']);
            Route::get('/properties/{id}', [PropertyController::class, 'show']);
            Route::put('/properties/{id}', [PropertyController::class, 'update']);
            Route::delete('/properties/{id}', [PropertyController::class, 'archive']);
            Route::get('/properties/{id}/units', [PropertyController::class, 'units']);
            Route::post('/properties/{id}/units', [PropertyController::class, 'storeUnit']);
            Route::get('/units', [UnitController::class, 'index']);
            Route::get('/units/{id}', [UnitController::class, 'show']);
            Route::put('/units/{id}', [UnitController::class, 'update']);
            Route::patch('/units/{id}/status', [UnitController::class, 'updateStatus']);

            // Tenants & Invitations (Section 8.4)
            Route::get('/tenants', [TenantController::class, 'index']);
            Route::post('/tenants', [TenantController::class, 'store']);
            Route::get('/tenants/{id}', [TenantController::class, 'show']);
            Route::put('/tenants/{id}', [TenantController::class, 'update']);
            Route::post('/tenants/{id}/invitations', [TenantController::class, 'invite']);

            // Leases (Create, Show, Update, Terminate, Renew — Section 8.4)
            Route::get('/leases', [LeaseController::class, 'index']);
            Route::post('/leases', [LeaseController::class, 'store']);
            Route::get('/leases/{id}', [LeaseController::class, 'show']);
            Route::put('/leases/{id}', [LeaseController::class, 'update']);
            Route::post('/leases/{id}/terminate', [LeaseController::class, 'terminate']);
            Route::post('/leases/{id}/renew', [LeaseController::class, 'renew']);

            // Invoices & Automated Billing Engine (Section 8.5)
            Route::get('/invoices', [InvoiceController::class, 'index']);
            Route::post('/invoices', [InvoiceController::class, 'store']);
            Route::get('/invoices/{id}', [InvoiceController::class, 'show']);
            Route::post('/invoices/{id}/send-reminder', [InvoiceController::class, 'sendReminder']);
            Route::post('/invoices/run-engine', [InvoiceController::class, 'runBillingEngine']);

            // Manual Payments, Verification, Rejection, Refund & Signed URL (Section 8.5)
            Route::get('/payments', [PaymentController::class, 'index']);
            Route::post('/payments/manual', [PaymentController::class, 'storeManual']);
            Route::post('/payments/{id}/verify', [PaymentController::class, 'verify']);
            Route::post('/payments/{id}/reject', [PaymentController::class, 'reject']);
            Route::post('/payments/{id}/refund', [PaymentController::class, 'refund']);
            Route::get('/payments/{id}/signed-url', [PaymentController::class, 'generateProofSignedUrl']);

            // Complaints (Section 8.6)
            Route::get('/complaints', [ComplaintController::class, 'index']);
            Route::post('/complaints', [ComplaintController::class, 'store']);
            Route::get('/complaints/{id}', [ComplaintController::class, 'show']);
            Route::patch('/complaints/{id}/status', [ComplaintController::class, 'updateStatus']);
            Route::post('/complaints/{id}/messages', [ComplaintController::class, 'storeMessage']);
            Route::post('/complaints/{id}/attachments', [ComplaintController::class, 'storeAttachment']);
            Route::post('/complaints/{id}/close', [ComplaintController::class, 'close']);

            // Notifications, Preferences & WhatsApp Delivery Logs (Section 8.6)
            Route::get('/notifications', [NotificationController::class, 'index']);
            Route::patch('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
            Route::get('/notification-preferences', [NotificationController::class, 'preferences']);
            Route::put('/notification-preferences', [NotificationController::class, 'updatePreferences']);

            // Reports & CSV Export (Section 4.8)
            Route::get('/reports/overview', [ReportController::class, 'overview']);
            Route::get('/reports/export-csv', [ReportController::class, 'exportCsv']);

            // Organization Activity Logs
            Route::get('/audit-logs', [AuditLogController::class, 'index']);
            }); // end EnsureStaffRole
        });
    });
});
