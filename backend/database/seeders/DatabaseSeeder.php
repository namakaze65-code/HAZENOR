<?php

namespace Database\Seeders;

use App\Models\AuditLog;
use App\Models\Organization;
use App\Models\OrganizationBankAccount;
use App\Models\OrganizationMember;
use App\Models\Role;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Support\TenantContext;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['code' => 'OWNER', 'name' => 'Owner'],
            ['code' => 'ADMIN', 'name' => 'Administrator'],
            ['code' => 'MANAGER', 'name' => 'Property Manager'],
            ['code' => 'FINANCE', 'name' => 'Finance Staff'],
            ['code' => 'STAFF', 'name' => 'Operational Staff'],
            ['code' => 'TENANT', 'name' => 'Tenant'],
        ];

        foreach ($roles as $r) {
            Role::updateOrCreate(['code' => $r['code']], ['name' => $r['name']]);
        }

        $plans = [
            [
                'code' => 'STARTER',
                'name' => 'Starter / Trial',
                'price' => 0,
                'billing_period' => 'MONTHLY',
                'max_units' => 5,
                'max_members' => 2,
                'monthly_whatsapp_quota' => 100,
                'features' => [
                    'manual_payment' => true,
                    'grace_period_days' => 7,
                ],
                'is_active' => true,
            ],
            [
                'code' => 'PRO',
                'name' => 'Pro Property Manager',
                'price' => 299000,
                'billing_period' => 'MONTHLY',
                'max_units' => 30,
                'max_members' => 10,
                'monthly_whatsapp_quota' => 1000,
                'features' => [
                    'manual_payment' => true,
                    'payment_gateway_byok' => true,
                    'grace_period_days' => 7,
                ],
                'is_active' => true,
            ],
            [
                'code' => 'BUSINESS',
                'name' => 'Business Enterprise',
                'price' => 799000,
                'billing_period' => 'MONTHLY',
                'max_units' => null,
                'max_members' => null,
                'monthly_whatsapp_quota' => 5000,
                'features' => [
                    'manual_payment' => true,
                    'payment_gateway_byok' => true,
                    'csv_export' => true,
                    'grace_period_days' => 7,
                ],
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(['code' => $plan['code']], $plan);
        }

        // Seed Primary Official Owner Account (hazenor.id@gmail.com) — Clean Production State (0 Demo Properties/Units/Invoices)
        $primaryOwner = User::firstOrCreate(
            ['email' => 'hazenor.id@gmail.com'],
            [
                'name' => 'HAZENOR Properties',
                'phone' => '088295107590',
                'password' => 'password123',
                'email_verified_at' => now(),
                'status' => 'ACTIVE',
            ]
        );

        // The primary HAZENOR account is also the platform super administrator (Portal Administrator)
        $primaryOwner->forceFill(['is_super_admin' => true])->save();

        $typoOwner = User::firstOrCreate(
            ['email' => 'hazenor.id@gmaiil.com'],
            [
                'name' => 'HAZENOR Properties',
                'phone' => '088295107590',
                'password' => 'password123',
                'email_verified_at' => now(),
                'status' => 'ACTIVE',
            ]
        );

        $aliasOwner = User::firstOrCreate(
            ['email' => 'owner@hazenor.id'],
            [
                'name' => 'HAZENOR Properties',
                'phone' => '088295107590',
                'password' => 'password123',
                'email_verified_at' => now(),
                'status' => 'ACTIVE',
            ]
        );

        $org = Organization::firstOrCreate(
            ['slug' => 'hazenor-properties'],
            [
                'name' => 'HAZENOR Properties',
                'owner_user_id' => $primaryOwner->id,
                'status' => 'ACTIVE',
                'timezone' => 'Asia/Jakarta',
                'settings' => [
                    'address' => 'Tangerang, Indonesia',
                    'phone' => '+62 882 9510 7590',
                    'email' => 'hazenor.id@gmail.com',
                ],
            ]
        );

        $ownerRole = Role::where('code', 'OWNER')->first();
        $proPlan = SubscriptionPlan::where('code', 'PRO')->first();

        TenantContext::set($org->id, 'OWNER');

        foreach ([$primaryOwner, $typoOwner, $aliasOwner] as $usr) {
            OrganizationMember::firstOrCreate(
                ['organization_id' => $org->id, 'user_id' => $usr->id],
                ['role_id' => $ownerRole->id, 'status' => 'ACTIVE']
            );
        }

        Subscription::firstOrCreate(
            ['organization_id' => $org->id],
            [
                'plan_id' => $proPlan->id,
                'status' => 'ACTIVE',
                'starts_at' => now(),
                'ends_at' => now()->addYear(),
                'grace_ends_at' => now()->addYear()->addDays(7),
            ]
        );

        OrganizationBankAccount::firstOrCreate(
            ['organization_id' => $org->id, 'account_number' => '8720-1928-33'],
            [
                'bank_name' => 'BCA',
                'account_holder_name' => 'HAZENOR Properties',
                'is_primary' => true,
                'is_active' => true,
            ]
        );

        if (AuditLog::where('organization_id', $org->id)->count() === 0) {
            AuditLog::create([
                'organization_id' => $org->id,
                'actor_user_id' => $primaryOwner->id,
                'action' => 'ORGANIZATION_INITIALIZED',
                'entity_type' => 'Organization',
                'entity_id' => $org->id,
                'old_values' => null,
                'new_values' => [
                    'name' => $org->name,
                    'location' => 'Tangerang, Indonesia',
                    'email' => 'hazenor.id@gmail.com',
                    'phone' => '+62 882 9510 7590',
                ],
                'ip_address' => '127.0.0.1',
            ]);
        }

        TenantContext::clear();
    }
}
