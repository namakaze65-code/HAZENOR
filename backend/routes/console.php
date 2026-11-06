<?php

use App\Models\Organization;
use App\Modules\Billing\Services\BillingEngineService;
use App\Support\TenantContext;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('ruko360:billing-run', function (BillingEngineService $engine) {
    $organizations = Organization::where('status', 'ACTIVE')->get();
    foreach ($organizations as $org) {
        TenantContext::set($org->id, 'SYSTEM_SCHEDULER');
        $summary = $engine->runForCurrentOrganization(null);
        $this->info("Org {$org->name}: generated={$summary['generated_invoices_count']}, overdue={$summary['marked_overdue_count']}");
        TenantContext::clear();
    }
})->purpose('Run automated billing schedules and overdue detection across all active organizations');

Schedule::command('ruko360:billing-run')->dailyAt('06:00');
