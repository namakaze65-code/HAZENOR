<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $rlsTables = [
        'organization_members',
        'organization_invitations',
        'organization_bank_accounts',
        'properties',
        'units',
        'tenants',
        'tenant_user_links',
        'tenant_invitations',
        'leases',
        'lease_documents',
        'billing_schedules',
        'invoices',
        'invoice_items',
        'payments',
        'payment_allocations',
        'payment_attempts',
        'payment_proofs',
        'complaints',
        'complaint_messages',
        'complaint_attachments',
        'complaint_status_history',
    ];

    public function up(): void
    {
        $isPostgres = DB::connection()->getDriverName() === 'pgsql';

        if ($isPostgres) {
            DB::statement('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
            DB::statement('CREATE EXTENSION IF NOT EXISTS "btree_gist"');
        }

        // 1. Identity, Roles, and Organizations
        Schema::create('roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 40)->unique();
            $table->string('name', 100);
            $table->timestampsTz();
        });

        Schema::create('permissions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 80)->unique();
            $table->string('name', 150);
            $table->timestampsTz();
        });

        Schema::create('role_permissions', function (Blueprint $table) {
            $table->foreignUuid('role_id')->constrained('roles')->cascadeOnDelete();
            $table->foreignUuid('permission_id')->constrained('permissions')->cascadeOnDelete();
            $table->primary(['role_id', 'permission_id']);
        });

        Schema::create('organizations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name', 150);
            $table->string('slug', 180)->unique();
            $table->foreignUuid('owner_user_id')->constrained('users');
            $table->string('status', 20)->default('ACTIVE');
            $table->string('timezone', 60)->default('Asia/Jakarta');
            $table->json('settings')->nullable();
            $table->timestampsTz();
        });

        Schema::create('organization_members', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('role_id')->constrained('roles');
            $table->string('status', 20)->default('ACTIVE');
            $table->timestampsTz();

            $table->unique(['organization_id', 'user_id']);
            $table->unique(['organization_id', 'id']);
        });

        Schema::create('organization_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('email', 255);
            $table->foreignUuid('role_id')->constrained('roles');
            $table->string('token_hash', 255)->unique();
            $table->timestampTz('expires_at');
            $table->timestampTz('accepted_at')->nullable();
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('organization_bank_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('bank_name', 100);
            $table->string('account_number', 50);
            $table->string('account_holder_name', 150);
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->unique(['organization_id', 'id']);
        });

        // 2. Properties & Units
        Schema::create('properties', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->string('name', 180);
            $table->text('address');
            $table->string('city', 100)->nullable();
            $table->string('province', 100)->nullable();
            $table->string('postal_code', 15)->nullable();
            $table->text('description')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestampsTz();

            $table->unique(['organization_id', 'id']);
            $table->index('organization_id');
        });

        Schema::create('units', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('property_id');
            $table->string('unit_number', 50);
            $table->integer('floor_number')->nullable();
            $table->decimal('area_sqm', 10, 2)->nullable();
            $table->decimal('rental_price', 18, 2);
            $table->string('status', 20)->default('AVAILABLE');
            $table->timestampsTz();

            $table->unique(['organization_id', 'id']);
            $table->unique(['property_id', 'unit_number']);
            $table->index(['organization_id', 'property_id', 'status']);
            $table->foreign(['organization_id', 'property_id'])
                ->references(['organization_id', 'id'])
                ->on('properties')
                ->cascadeOnDelete();
        });

        // 3. Tenants & Leases
        Schema::create('tenants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('full_name', 150);
            $table->string('phone', 30);
            $table->string('email', 255)->nullable();
            $table->text('identity_number_encrypted')->nullable();
            $table->text('address')->nullable();
            $table->string('status', 20)->default('ACTIVE');
            $table->timestampsTz();

            $table->unique(['organization_id', 'id']);
            $table->index(['organization_id', 'phone']);
        });

        Schema::create('tenant_user_links', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('tenant_id');
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->timestampTz('verified_at')->nullable();
            $table->timestampsTz();

            $table->unique(['organization_id', 'tenant_id', 'user_id']);
            $table->foreign(['organization_id', 'tenant_id'])
                ->references(['organization_id', 'id'])
                ->on('tenants')
                ->cascadeOnDelete();
        });

        Schema::create('tenant_invitations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('tenant_id');
            $table->string('destination', 255);
            $table->string('token_hash', 255)->unique();
            $table->timestampTz('expires_at');
            $table->timestampTz('accepted_at')->nullable();
            $table->timestampTz('revoked_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign(['organization_id', 'tenant_id'])
                ->references(['organization_id', 'id'])
                ->on('tenants')
                ->cascadeOnDelete();
        });

        Schema::create('leases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('unit_id');
            $table->uuid('tenant_id');
            $table->string('lease_number', 80);
            $table->date('start_date');
            $table->date('end_date');
            $table->decimal('rental_price', 18, 2);
            $table->string('billing_cycle', 20)->default('YEARLY'); // MONTHLY, QUARTERLY, SEMI_ANNUAL, YEARLY
            $table->smallInteger('due_day')->default(1);
            $table->decimal('deposit_amount', 18, 2)->default(0);
            $table->string('status', 20)->default('ACTIVE');
            $table->text('terms')->nullable();
            $table->timestampsTz();

            $table->unique(['organization_id', 'id']);
            $table->unique(['organization_id', 'lease_number']);
            $table->index(['organization_id', 'status', 'start_date', 'end_date']);

            $table->foreign(['organization_id', 'unit_id'])
                ->references(['organization_id', 'id'])
                ->on('units');
            $table->foreign(['organization_id', 'tenant_id'])
                ->references(['organization_id', 'id'])
                ->on('tenants');
        });

        if ($isPostgres) {
            DB::statement("
                ALTER TABLE leases
                ADD CONSTRAINT leases_no_overlapping_active_unit
                EXCLUDE USING gist (
                    unit_id WITH =,
                    daterange(start_date, end_date, '[]') WITH &&
                )
                WHERE (status IN ('ACTIVE', 'PENDING'))
            ");
        }

        Schema::create('lease_documents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('lease_id');
            $table->string('storage_key', 500);
            $table->string('original_filename', 255);
            $table->string('mime_type', 100);
            $table->bigInteger('size_bytes');
            $table->foreignUuid('uploaded_by')->constrained('users');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign(['organization_id', 'lease_id'])
                ->references(['organization_id', 'id'])
                ->on('leases')
                ->cascadeOnDelete();
        });

        // 4. Billing & Payments
        Schema::create('billing_schedules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('lease_id');
            $table->date('next_run_date');
            $table->string('billing_cycle', 20);
            $table->boolean('is_active')->default(true);
            $table->timestampsTz();

            $table->foreign(['organization_id', 'lease_id'])
                ->references(['organization_id', 'id'])
                ->on('leases')
                ->cascadeOnDelete();
        });

        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('lease_id');
            $table->string('invoice_number', 80);
            $table->date('billing_period_start');
            $table->date('billing_period_end');
            $table->date('issue_date');
            $table->date('due_date');
            $table->decimal('subtotal', 18, 2);
            $table->decimal('discount', 18, 2)->default(0);
            $table->decimal('tax', 18, 2)->default(0);
            $table->decimal('total', 18, 2);
            $table->decimal('paid_amount', 18, 2)->default(0);
            $table->string('status', 25)->default('UNPAID');
            $table->timestampsTz();

            $table->unique(['organization_id', 'id']);
            $table->unique(['organization_id', 'invoice_number']);
            $table->unique(['lease_id', 'billing_period_start']);
            $table->index(['organization_id', 'status', 'due_date']);

            $table->foreign(['organization_id', 'lease_id'])
                ->references(['organization_id', 'id'])
                ->on('leases');
        });

        Schema::create('invoice_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('invoice_id');
            $table->string('description', 255);
            $table->decimal('quantity', 12, 2)->default(1);
            $table->decimal('unit_price', 18, 2);
            $table->decimal('amount', 18, 2);
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign(['organization_id', 'invoice_id'])
                ->references(['organization_id', 'id'])
                ->on('invoices')
                ->cascadeOnDelete();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('destination_bank_account_id')->nullable();
            $table->string('payment_number', 80);
            $table->decimal('amount', 18, 2);
            $table->string('method', 30)->default('MANUAL_TRANSFER');
            $table->string('provider', 50)->nullable();
            $table->string('provider_reference', 180)->nullable();
            $table->string('status', 20)->default('PENDING');
            $table->timestampTz('paid_at')->nullable();
            $table->timestampTz('verified_at')->nullable();
            $table->foreignUuid('verified_by')->nullable()->constrained('users');
            $table->text('rejection_reason')->nullable();
            $table->timestampsTz();

            $table->unique(['organization_id', 'id']);
            $table->unique(['organization_id', 'payment_number']);
            $table->index(['organization_id', 'status', 'created_at']);

            $table->foreign(['organization_id', 'destination_bank_account_id'])
                ->references(['organization_id', 'id'])
                ->on('organization_bank_accounts');
        });

        Schema::create('payment_allocations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('payment_id');
            $table->uuid('invoice_id');
            $table->decimal('amount', 18, 2);
            $table->timestampTz('created_at')->useCurrent();

            $table->index('invoice_id');
            $table->foreign(['organization_id', 'payment_id'])
                ->references(['organization_id', 'id'])
                ->on('payments')
                ->cascadeOnDelete();
            $table->foreign(['organization_id', 'invoice_id'])
                ->references(['organization_id', 'id'])
                ->on('invoices');
        });

        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('invoice_id');
            $table->string('provider', 50);
            $table->string('provider_reference', 180)->nullable();
            $table->string('idempotency_key', 180)->unique();
            $table->string('status', 30)->default('INITIATED');
            $table->timestampTz('expires_at')->nullable();
            $table->timestampsTz();

            $table->foreign(['organization_id', 'invoice_id'])
                ->references(['organization_id', 'id'])
                ->on('invoices');
        });

        Schema::create('payment_gateway_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('provider', 50);
            $table->string('provider_event_id', 180)->unique();
            $table->json('payload');
            $table->boolean('signature_verified')->default(false);
            $table->timestampTz('processed_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('payment_proofs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('payment_id');
            $table->string('storage_key', 500);
            $table->string('original_filename', 255)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->bigInteger('size_bytes')->nullable();
            $table->foreignUuid('uploaded_by')->constrained('users');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign(['organization_id', 'payment_id'])
                ->references(['organization_id', 'id'])
                ->on('payments')
                ->cascadeOnDelete();
        });

        // 5. Complaints & Notifications
        Schema::create('complaints', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('tenant_id');
            $table->uuid('unit_id');
            $table->string('ticket_number', 80);
            $table->string('title', 180);
            $table->text('description');
            $table->string('category', 50)->nullable();
            $table->string('priority', 20)->default('MEDIUM');
            $table->string('status', 25)->default('NEW');
            $table->foreignUuid('assigned_to')->nullable()->constrained('users');
            $table->timestampTz('resolved_at')->nullable();
            $table->timestampsTz();

            $table->unique(['organization_id', 'id']);
            $table->unique(['organization_id', 'ticket_number']);
            $table->index(['organization_id', 'status', 'created_at']);

            $table->foreign(['organization_id', 'tenant_id'])
                ->references(['organization_id', 'id'])
                ->on('tenants');
            $table->foreign(['organization_id', 'unit_id'])
                ->references(['organization_id', 'id'])
                ->on('units');
        });

        Schema::create('complaint_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('complaint_id');
            $table->foreignUuid('sender_user_id')->constrained('users');
            $table->text('message');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign(['organization_id', 'complaint_id'])
                ->references(['organization_id', 'id'])
                ->on('complaints')
                ->cascadeOnDelete();
        });

        Schema::create('complaint_attachments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('complaint_id');
            $table->string('storage_key', 500);
            $table->string('original_filename', 255)->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->bigInteger('size_bytes')->nullable();
            $table->foreignUuid('uploaded_by')->constrained('users');
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign(['organization_id', 'complaint_id'])
                ->references(['organization_id', 'id'])
                ->on('complaints')
                ->cascadeOnDelete();
        });

        Schema::create('complaint_status_history', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('complaint_id');
            $table->string('old_status', 25)->nullable();
            $table->string('new_status', 25);
            $table->foreignUuid('changed_by')->constrained('users');
            $table->text('note')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->foreign(['organization_id', 'complaint_id'])
                ->references(['organization_id', 'id'])
                ->on('complaints')
                ->cascadeOnDelete();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->nullable()->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->cascadeOnDelete();
            $table->string('channel', 20);
            $table->string('template_key', 100)->nullable();
            $table->string('recipient', 255);
            $table->json('payload');
            $table->string('status', 20)->default('PENDING');
            $table->string('provider_reference', 180)->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('read_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['status', 'created_at']);
        });

        Schema::create('notification_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('notification_id')->constrained('notifications')->cascadeOnDelete();
            $table->integer('attempt_number')->default(1);
            $table->string('provider_status', 50);
            $table->string('error_code', 100)->nullable();
            $table->text('error_message')->nullable();
            $table->timestampTz('attempted_at')->useCurrent();
        });

        // 6. Subscriptions & Audit Logs
        Schema::create('subscription_plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name', 100);
            $table->decimal('price', 18, 2);
            $table->string('billing_period', 20)->default('MONTHLY');
            $table->integer('max_units')->nullable();
            $table->integer('max_members')->nullable();
            $table->integer('monthly_whatsapp_quota')->default(0);
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('organization_id')->constrained('organizations')->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained('subscription_plans');
            $table->string('status', 20)->default('TRIAL');
            $table->timestampTz('starts_at');
            $table->timestampTz('ends_at')->nullable();
            $table->timestampTz('grace_ends_at')->nullable();
            $table->timestampsTz();
        });

        Schema::create('subscription_payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('subscription_id')->constrained('subscriptions')->cascadeOnDelete();
            $table->decimal('amount', 18, 2);
            $table->string('provider', 50);
            $table->string('provider_reference', 180);
            $table->string('status', 20);
            $table->timestampTz('paid_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignUuid('organization_id')->nullable()->constrained('organizations')->nullOnDelete();
            $table->foreignUuid('actor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('action', 100);
            $table->string('entity_type', 100);
            $table->uuid('entity_id')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestampTz('created_at')->useCurrent();

            $table->index(['organization_id', 'created_at']);
        });

        // 7. Enable & Force PostgreSQL Row Level Security (RLS) on all tenant tables
        if ($isPostgres) {
            foreach ($this->rlsTables as $tableName) {
                DB::statement("ALTER TABLE {$tableName} ENABLE ROW LEVEL SECURITY");
                DB::statement("ALTER TABLE {$tableName} FORCE ROW LEVEL SECURITY");
                DB::statement("
                    CREATE POLICY tenant_isolation_policy ON {$tableName}
                    USING (
                        organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid
                    )
                    WITH CHECK (
                        organization_id = NULLIF(current_setting('app.current_organization_id', true), '')::uuid
                    )
                ");
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'audit_logs',
            'subscription_payments',
            'subscriptions',
            'subscription_plans',
            'notification_logs',
            'notifications',
            'complaint_status_history',
            'complaint_attachments',
            'complaint_messages',
            'complaints',
            'payment_proofs',
            'payment_gateway_events',
            'payment_attempts',
            'payment_allocations',
            'payments',
            'invoice_items',
            'invoices',
            'billing_schedules',
            'lease_documents',
            'leases',
            'tenant_invitations',
            'tenant_user_links',
            'tenants',
            'units',
            'properties',
            'organization_bank_accounts',
            'organization_invitations',
            'organization_members',
            'organizations',
            'role_permissions',
            'permissions',
            'roles',
        ];

        foreach ($tables as $t) {
            Schema::dropIfExists($t);
        }
    }
};
