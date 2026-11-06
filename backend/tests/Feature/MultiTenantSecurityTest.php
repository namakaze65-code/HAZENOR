<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\Tenant;
use App\Support\TenantContext;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MultiTenantSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_owner_a_cannot_read_or_access_owner_b_organization_data(): void
    {
        // 1. Register Owner A
        $resA = $this->postJson('/api/v1/auth/register', [
            'name' => 'Owner A',
            'organization_name' => 'Ruko Jaya Abadi',
            'email' => 'ownera@example.com',
            'password' => 'password123',
        ])->assertCreated();

        $tokenA = $resA->json('data.token');
        $orgIdA = $resA->json('data.active_organization.id');

        // 2. Register Owner B
        $resB = $this->postJson('/api/v1/auth/register', [
            'name' => 'Owner B',
            'organization_name' => 'Ruko Makmur Sentosa',
            'email' => 'ownerb@example.com',
            'password' => 'password123',
        ])->assertCreated();

        $tokenB = $resB->json('data.token');
        $orgIdB = $resB->json('data.active_organization.id');

        // 3. Owner A creates a Property in Org A
        $propA = $this->withHeaders([
            'Authorization' => "Bearer {$tokenA}",
            'X-Organization-Id' => $orgIdA,
        ])->postJson('/api/v1/properties', [
            'name' => 'Ruko Golden Blok A',
            'address' => 'Jl. Sudirman No. 10',
            'city' => 'Jakarta',
        ])->assertCreated();

        $propertyIdA = $propA->json('data.id');

        // 4. Owner B tries to spoof X-Organization-Id to Org A -> Must be rejected with 403
        $this->app['auth']->forgetGuards();
        $this->withHeaders([
            'Authorization' => "Bearer {$tokenB}",
            'X-Organization-Id' => $orgIdA,
        ])->getJson('/api/v1/properties')
            ->assertForbidden();

        // 5. Owner B tries to fetch Owner A's Property UUID under Org B context -> 404 Not Found (isolated)
        $this->app['auth']->forgetGuards();
        $this->withHeaders([
            'Authorization' => "Bearer {$tokenB}",
            'X-Organization-Id' => $orgIdB,
        ])->getJson("/api/v1/properties/{$propertyIdA}")
            ->assertNotFound();
    }

    public function test_unit_cannot_have_overlapping_active_leases_and_manual_payment_verification_works_atomically(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Budi Owner',
            'organization_name' => 'PT Ruko Nusantara',
            'email' => 'budi@ruko360.id',
            'password' => 'password123',
        ])->assertCreated();

        $token = $res->json('data.token');
        $orgId = $res->json('data.active_organization.id');
        $headers = [
            'Authorization' => "Bearer {$token}",
            'X-Organization-Id' => $orgId,
        ];

        // Create Bank Account
        $bankRes = $this->withHeaders($headers)->postJson('/api/v1/organizations/bank-accounts', [
            'bank_name' => 'BCA',
            'account_number' => '8720192833',
            'account_holder_name' => 'PT Ruko Nusantara',
            'is_primary' => true,
        ])->assertCreated();
        $bankId = $bankRes->json('data.id');

        // Create Property & Unit
        $propRes = $this->withHeaders($headers)->postJson('/api/v1/properties', [
            'name' => 'Kompleks Ruko Harmoni',
            'address' => 'Jl. Gajah Mada No. 1',
        ])->assertCreated();
        $propertyId = $propRes->json('data.id');

        $unitRes = $this->withHeaders($headers)->postJson("/api/v1/properties/{$propertyId}/units", [
            'unit_number' => 'A-01',
            'floor_number' => 3,
            'area_sqm' => 150,
            'rental_price' => 120000000,
        ])->assertCreated();
        $unitId = $unitRes->json('data.id');

        // Create Tenant inside Org context
        TenantContext::set($orgId, 'OWNER');
        $tenant = Tenant::create([
            'full_name' => 'PT Penyewa Sukses',
            'phone' => '08123456789',
            'identity_number_encrypted' => '3171012345678901',
            'status' => 'ACTIVE',
        ]);
        TenantContext::clear();

        // Create first Lease (YEARLY)
        $leaseRes = $this->withHeaders($headers)->postJson('/api/v1/leases', [
            'unit_id' => $unitId,
            'tenant_id' => $tenant->id,
            'lease_number' => 'LEASE-2026-001',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'rental_price' => 120000000,
            'billing_cycle' => 'YEARLY',
            'due_day' => 10,
        ])->assertCreated();
        $leaseId = $leaseRes->json('data.id');

        // Attempt to create overlapping Lease on the same unit -> Must fail with 422
        $this->withHeaders($headers)->postJson('/api/v1/leases', [
            'unit_id' => $unitId,
            'tenant_id' => $tenant->id,
            'lease_number' => 'LEASE-2026-002',
            'start_date' => '2026-06-01',
            'end_date' => '2027-05-31',
            'rental_price' => 120000000,
            'billing_cycle' => 'YEARLY',
            'due_day' => 10,
        ])->assertStatus(422);

        // Create an Invoice for the Lease
        TenantContext::set($orgId, 'OWNER');
        $invoice = Invoice::create([
            'lease_id' => $leaseId,
            'invoice_number' => 'INV-2026-001',
            'billing_period_start' => '2026-01-01',
            'billing_period_end' => '2026-12-31',
            'issue_date' => '2026-01-01',
            'due_date' => '2026-01-10',
            'subtotal' => 120000000,
            'discount' => 0,
            'tax' => 0,
            'total' => 120000000,
            'paid_amount' => 0,
            'status' => 'UNPAID',
        ]);
        TenantContext::clear();

        // Send WhatsApp Reminder for Unpaid Invoice -> Creates notification + notification_logs
        $this->withHeaders($headers)
            ->postJson("/api/v1/invoices/{$invoice->id}/send-reminder")
            ->assertOk()
            ->assertJsonPath('data.status', 'SENT');

        // Submit Manual Payment (PENDING) -> Should NOT reduce invoice balance yet
        $payRes = $this->withHeaders($headers)->postJson('/api/v1/payments/manual', [
            'destination_bank_account_id' => $bankId,
            'payment_number' => 'PAY-2026-001',
            'amount' => 50000000,
        ])->assertCreated();
        $paymentId = $payRes->json('data.id');

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'paid_amount' => 0,
            'status' => 'UNPAID',
        ]);

        // Verify Manual Payment (Partial Payment of 50,000,000) -> Status becomes PARTIALLY_PAID + AuditLog recorded
        $this->withHeaders($headers)->postJson("/api/v1/payments/{$paymentId}/verify", [
            'invoice_id' => $invoice->id,
            'allocated_amount' => 50000000,
        ])->assertOk()
            ->assertJsonPath('data.invoice.status', 'PARTIALLY_PAID')
            ->assertJsonPath('data.invoice.paid_amount', '50000000.00');

        // Refund the Verified Payment -> Status becomes REFUNDED and invoice returns to UNPAID (0.00)
        $this->withHeaders($headers)
            ->postJson("/api/v1/payments/{$paymentId}/refund")
            ->assertOk()
            ->assertJsonPath('data.status', 'REFUNDED');

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'paid_amount' => 0,
            'status' => 'UNPAID',
        ]);

        // Test Idempotent Payment Gateway Webhook (PAY-06, PAY-07)
        $webhookPayload = [
            'provider_event_id' => 'evt_midtrans_998877',
            'organization_id' => $orgId,
            'invoice_id' => $invoice->id,
            'amount' => 120000000,
            'provider_reference' => 'MID-REF-001',
        ];

        // Webhook without the shared secret must be rejected
        config(['services.payment_webhook.secret' => 'test-webhook-secret']);
        $this->postJson('/api/v1/webhooks/payments/midtrans', $webhookPayload)
            ->assertStatus(401);

        $this->withHeaders(['X-Webhook-Secret' => 'test-webhook-secret'])
            ->postJson('/api/v1/webhooks/payments/midtrans', $webhookPayload)
            ->assertOk()
            ->assertJsonPath('data.invoice_status', 'PAID');

        // Sending exact same webhook event a second time must be ignored idempotently without double-counting
        $this->withHeaders(['X-Webhook-Secret' => 'test-webhook-secret'])
            ->postJson('/api/v1/webhooks/payments/midtrans', $webhookPayload)
            ->assertOk()
            ->assertJsonPath('data.idempotent_duplicate', true);
    }

    public function test_tenant_invitation_token_is_single_use_and_links_account(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Owner Invite',
            'organization_name' => 'PT Invite Properti',
            'email' => 'invite@ruko360.id',
            'password' => 'password123',
        ])->assertCreated();

        $token = $res->json('data.token');
        $orgId = $res->json('data.active_organization.id');
        $headers = [
            'Authorization' => "Bearer {$token}",
            'X-Organization-Id' => $orgId,
        ];

        $tenantRes = $this->withHeaders($headers)->postJson('/api/v1/tenants', [
            'full_name' => 'Penyewa Baru',
            'phone' => '081233445566',
            'email' => 'penyewa@contoh.id',
        ])->assertCreated();

        $tenantId = $tenantRes->json('data.id');

        $invRes = $this->withHeaders($headers)
            ->postJson("/api/v1/tenants/{$tenantId}/invitations")
            ->assertCreated();

        $rawInviteToken = $invRes->json('data.invitation_token');

        // 1st accept -> Succeeds
        $this->postJson('/api/v1/auth/accept-invitation', [
            'token' => $rawInviteToken,
            'name' => 'Akun Penyewa Baru',
            'email' => 'penyewa@contoh.id',
            'password' => 'password123',
        ])->assertOk();

        // 2nd accept with same token -> Must fail with 422 (one-time use)
        $this->postJson('/api/v1/auth/accept-invitation', [
            'token' => $rawInviteToken,
            'name' => 'Akun Penyewa Baru',
            'email' => 'penyewa@contoh.id',
            'password' => 'password123',
        ])->assertStatus(422);

        // Tenant logs in -> routed to tenant portal and blocked from owner/staff endpoints
        $login = $this->postJson('/api/v1/auth/login', [
            'email' => 'penyewa@contoh.id',
            'password' => 'password123',
        ])->assertOk()
            ->assertJsonPath('data.portal', 'tenant')
            ->assertJsonPath('data.active_organization.role', 'TENANT');

        $tenantHeaders = [
            'Authorization' => 'Bearer '.$login->json('data.token'),
            'X-Organization-Id' => $orgId,
        ];

        $this->app['auth']->forgetGuards();
        $this->withHeaders($tenantHeaders)->getJson('/api/v1/tenants')->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->withHeaders($tenantHeaders)->getJson('/api/v1/invoices')->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->withHeaders($tenantHeaders)->getJson('/api/v1/admin/dashboard')->assertStatus(403);
        $this->app['auth']->forgetGuards();
        $this->withHeaders($tenantHeaders)->getJson('/api/v1/tenant-portal/invoices')->assertOk();
        $this->app['auth']->forgetGuards();
        $this->withHeaders($tenantHeaders)->getJson('/api/v1/tenant-portal/overview')
            ->assertOk()
            ->assertJsonPath('data.tenant.id', $tenantId);

        // Owner cannot use the tenant-only portal API
        $this->app['auth']->forgetGuards();
        $this->withHeaders($headers)->getJson('/api/v1/tenant-portal/invoices')->assertStatus(403);
    }

    public function test_subscription_unit_quota_enforcement_and_unit_price_snapshot_integrity(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Owner Quota',
            'organization_name' => 'PT Quota Ruko',
            'email' => 'quota@ruko360.id',
            'password' => 'password123',
        ])->assertCreated();

        $token = $res->json('data.token');
        $orgId = $res->json('data.active_organization.id');
        $headers = [
            'Authorization' => "Bearer {$token}",
            'X-Organization-Id' => $orgId,
        ];

        $propRes = $this->withHeaders($headers)->postJson('/api/v1/properties', [
            'name' => 'Ruko Starter',
            'address' => 'Jl. Starter No. 1',
        ])->assertCreated()
            ->assertHeader('X-Request-Id');

        $propertyId = $propRes->json('data.id');

        // Starter plan allows max 5 units -> Create 5 units
        $firstUnitId = null;
        for ($i = 1; $i <= 5; $i++) {
            $uRes = $this->withHeaders($headers)->postJson("/api/v1/properties/{$propertyId}/units", [
                'unit_number' => "U-0{$i}",
                'rental_price' => 100000000,
            ])->assertCreated();
            if ($i === 1) {
                $firstUnitId = $uRes->json('data.id');
            }
        }

        // 6th unit on Starter plan -> Must be blocked with 422 (SUB-02)
        $this->withHeaders($headers)->postJson("/api/v1/properties/{$propertyId}/units", [
            'unit_number' => 'U-06',
            'rental_price' => 100000000,
        ])->assertStatus(422);

        // Super Admin upgrades organization to PRO (max 30 units) -> 6th unit now succeeds
        // A normal owner must NOT be able to call the super admin API
        $this->withHeaders($headers)->patchJson("/api/v1/admin/organizations/{$orgId}/status", [
            'plan_code' => 'PRO',
            'reason' => 'Upgrade ke Paket Pro',
        ])->assertStatus(403);

        $superAdmin = \App\Models\User::factory()->create(['is_super_admin' => true]);
        $superToken = $superAdmin->createToken('test')->plainTextToken;
        $this->app['auth']->forgetGuards();

        $this->withHeaders(['Authorization' => "Bearer {$superToken}"])
            ->patchJson("/api/v1/admin/organizations/{$orgId}/status", [
            'plan_code' => 'PRO',
            'reason' => 'Upgrade ke Paket Pro',
        ])->assertOk();

        $this->app['auth']->forgetGuards();
        $this->withHeaders($headers)->postJson("/api/v1/properties/{$propertyId}/units", [
            'unit_number' => 'U-06',
            'rental_price' => 100000000,
        ])->assertCreated();

        // Create Tenant and Lease on U-01 at 100,000,000
        $tenantRes = $this->withHeaders($headers)->postJson('/api/v1/tenants', [
            'full_name' => 'PT Snapshot',
            'phone' => '081200001111',
        ])->assertCreated();

        $leaseRes = $this->withHeaders($headers)->postJson('/api/v1/leases', [
            'unit_id' => $firstUnitId,
            'tenant_id' => $tenantRes->json('data.id'),
            'lease_number' => 'LEASE-SNAP-01',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
            'rental_price' => 100000000,
            'billing_cycle' => 'YEARLY',
            'due_day' => 5,
        ])->assertCreated();
        $leaseId = $leaseRes->json('data.id');

        // Update Unit rental_price to 150,000,000 -> Active lease snapshot price must remain 100,000,000 (UNIT-05, LEASE-05)
        $this->withHeaders($headers)->putJson("/api/v1/units/{$firstUnitId}", [
            'rental_price' => 150000000,
        ])->assertOk();

        $this->assertDatabaseHas('leases', [
            'id' => $leaseId,
            'rental_price' => 100000000,
        ]);
    }

    public function test_complaint_lifecycle_notification_preferences_and_scheduled_billing_command(): void
    {
        $res = $this->postJson('/api/v1/auth/register', [
            'name' => 'Owner Ops',
            'organization_name' => 'PT Operasional Ruko',
            'email' => 'ops@ruko360.id',
            'password' => 'password123',
        ])->assertCreated();

        $token = $res->json('data.token');
        $orgId = $res->json('data.active_organization.id');
        $headers = [
            'Authorization' => "Bearer {$token}",
            'X-Organization-Id' => $orgId,
        ];

        $propId = $this->withHeaders($headers)->postJson('/api/v1/properties', [
            'name' => 'Ruko Ops',
            'address' => 'Jl. Ops No. 9',
        ])->json('data.id');

        $unitId = $this->withHeaders($headers)->postJson("/api/v1/properties/{$propId}/units", [
            'unit_number' => 'B-01',
            'rental_price' => 80000000,
        ])->json('data.id');

        $tenantId = $this->withHeaders($headers)->postJson('/api/v1/tenants', [
            'full_name' => 'Penyewa Ops',
            'phone' => '081399998888',
        ])->json('data.id');

        // Create Complaint
        $compRes = $this->withHeaders($headers)->postJson('/api/v1/complaints', [
            'tenant_id' => $tenantId,
            'unit_id' => $unitId,
            'ticket_number' => 'TCK-OPS-001',
            'title' => 'Atap bocor saat hujan deras',
            'description' => 'Mohon perbaikan segera di lantai 2',
            'priority' => 'HIGH',
        ])->assertCreated();
        $complaintId = $compRes->json('data.id');

        // Add message & attachment to complaint
        $this->withHeaders($headers)->postJson("/api/v1/complaints/{$complaintId}/messages", [
            'message' => 'Teknisi dijadwalkan datang besok pagi pukul 09.00 WIB.',
        ])->assertCreated();

        $this->withHeaders($headers)->postJson("/api/v1/complaints/{$complaintId}/attachments", [
            'file_path' => 'private/complaints/atap-bocor.jpg',
            'mime_type' => 'image/jpeg',
            'file_size' => 204800,
        ])->assertCreated();

        // Close complaint and verify status history
        $this->withHeaders($headers)->postJson("/api/v1/complaints/{$complaintId}/close", [
            'note' => 'Perbaikan atap telah selesai dan diverifikasi penyewa.',
        ])->assertOk()
            ->assertJsonPath('data.status', 'CLOSED');

        // Update notification preferences (NOTIF-07)
        $this->withHeaders($headers)->putJson('/api/v1/notification-preferences', [
            'whatsapp_enabled' => true,
            'email_enabled' => false,
            'in_app_enabled' => true,
        ])->assertOk()
            ->assertJsonPath('data.email_enabled', false);

        // Run scheduled Artisan command ruko360:billing-run
        $this->artisan('ruko360:billing-run')->assertExitCode(0);
    }
}
