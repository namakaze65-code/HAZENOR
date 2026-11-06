<?php

namespace App\Modules\Billing\Services;

use App\Jobs\SendWhatsAppNotificationJob;
use App\Models\AuditLog;
use App\Models\BillingSchedule;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\NotificationRecord;
use App\Support\TenantContext;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class BillingEngineService
{
    public function runForCurrentOrganization(?string $actorUserId = null): array
    {
        $orgId = TenantContext::get();
        $today = Carbon::today();
        $generatedInvoices = 0;
        $markedOverdue = 0;

        // 1. Mark unpaid/partially_paid invoices past due_date as OVERDUE
        $overdueCandidates = Invoice::whereIn('status', ['UNPAID', 'PARTIALLY_PAID'])
            ->whereDate('due_date', '<', $today)
            ->get();

        foreach ($overdueCandidates as $inv) {
            $oldStatus = $inv->status;
            $inv->update(['status' => 'OVERDUE']);
            $markedOverdue++;

            AuditLog::create([
                'organization_id' => $orgId,
                'actor_user_id' => $actorUserId,
                'action' => 'INVOICE_MARKED_OVERDUE',
                'entity_type' => 'Invoice',
                'entity_id' => $inv->id,
                'old_values' => ['status' => $oldStatus],
                'new_values' => ['status' => 'OVERDUE', 'due_date' => $inv->due_date->format('Y-m-d')],
                'ip_address' => '127.0.0.1',
            ]);
        }

        // 2. Process active billing_schedules where next_run_date <= today
        $schedules = BillingSchedule::with('lease.tenant', 'lease.unit')
            ->where('is_active', true)
            ->whereDate('next_run_date', '<=', $today)
            ->get();

        foreach ($schedules as $schedule) {
            $lease = $schedule->lease;
            if (! $lease || $lease->status !== 'ACTIVE') {
                continue;
            }

            $periodStart = Carbon::parse($schedule->next_run_date);
            $periodEnd = $this->calculatePeriodEnd($periodStart, $schedule->billing_cycle);

            $alreadyExists = Invoice::where('lease_id', $lease->id)
                ->whereDate('billing_period_start', $periodStart)
                ->exists();

            DB::transaction(function () use (
                $alreadyExists,
                $schedule,
                $lease,
                $periodStart,
                $periodEnd,
                $orgId,
                &$generatedInvoices
            ) {
                if (! $alreadyExists) {
                    $invoiceNumber = 'INV-'.$periodStart->format('Ym').'-'. strtoupper(substr($lease->id, 0, 4));
                    $dueDate = $periodStart->copy()->day(min((int) $lease->due_day, $periodStart->daysInMonth));
                    if ($dueDate->lt($periodStart)) {
                        $dueDate = $periodStart->copy()->addDays(7);
                    }

                    $invoice = Invoice::create([
                        'lease_id' => $lease->id,
                        'invoice_number' => $invoiceNumber,
                        'billing_period_start' => $periodStart->format('Y-m-d'),
                        'billing_period_end' => $periodEnd->format('Y-m-d'),
                        'issue_date' => now()->format('Y-m-d'),
                        'due_date' => $dueDate->format('Y-m-d'),
                        'subtotal' => $lease->rental_price,
                        'discount' => 0,
                        'tax' => 0,
                        'total' => $lease->rental_price,
                        'paid_amount' => 0,
                        'status' => 'UNPAID',
                    ]);

                    InvoiceItem::create([
                        'invoice_id' => $invoice->id,
                        'description' => "Tagihan Sewa Unit {$lease->unit?->unit_number} ({$schedule->billing_cycle})",
                        'quantity' => 1,
                        'unit_price' => $lease->rental_price,
                        'amount' => $lease->rental_price,
                    ]);

                    if ($lease->tenant?->phone) {
                        $notif = NotificationRecord::create([
                            'user_id' => $lease->tenant->user_id,
                            'channel' => 'WHATSAPP',
                            'template_key' => 'INVOICE_ISSUED',
                            'recipient' => $lease->tenant->phone,
                            'payload' => [
                                'invoice_number' => $invoice->invoice_number,
                                'total' => $invoice->total,
                                'due_date' => $invoice->due_date->format('Y-m-d'),
                            ],
                            'status' => 'PENDING',
                        ]);

                        SendWhatsAppNotificationJob::dispatch($orgId, $notif->id);
                    }

                    $generatedInvoices++;
                }

                // Advance next_run_date to next cycle
                $nextRun = $periodEnd->copy()->addDay();
                $schedule->update(['next_run_date' => $nextRun->format('Y-m-d')]);
            });
        }

        // 3. Automated H-3, H-0 (due date), and H+1 WhatsApp reminders for unpaid/overdue invoices (NOTIF-03)
        $reminderDates = [
            'REMINDER_H_MINUS_3' => $today->copy()->addDays(3)->format('Y-m-d'),
            'REMINDER_DUE_TODAY' => $today->format('Y-m-d'),
            'REMINDER_H_PLUS_1' => $today->copy()->subDay()->format('Y-m-d'),
        ];

        $scheduledReminders = 0;
        foreach ($reminderDates as $templateKey => $targetDueDate) {
            $dueInvoices = Invoice::with('lease.tenant')
                ->whereIn('status', ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])
                ->whereDate('due_date', $targetDueDate)
                ->get();

            foreach ($dueInvoices as $inv) {
                $phone = $inv->lease?->tenant?->phone;
                if (! $phone) {
                    continue;
                }

                $notif = NotificationRecord::create([
                    'user_id' => $inv->lease?->tenant?->user_id,
                    'channel' => 'WHATSAPP',
                    'template_key' => $templateKey,
                    'recipient' => $phone,
                    'payload' => [
                        'invoice_number' => $inv->invoice_number,
                        'total' => $inv->total,
                        'due_date' => $inv->due_date->format('Y-m-d'),
                    ],
                    'status' => 'PENDING',
                ]);

                SendWhatsAppNotificationJob::dispatch($orgId, $notif->id);
                $scheduledReminders++;
            }
        }

        return [
            'generated_invoices_count' => $generatedInvoices,
            'marked_overdue_count' => $markedOverdue,
            'scheduled_reminders_count' => $scheduledReminders,
        ];
    }

    private function calculatePeriodEnd(Carbon $start, string $cycle): Carbon
    {
        return match ($cycle) {
            'MONTHLY' => $start->copy()->addMonthNoOverflow()->subDay(),
            'QUARTERLY' => $start->copy()->addMonthsNoOverflow(3)->subDay(),
            'SEMI_ANNUAL' => $start->copy()->addMonthsNoOverflow(6)->subDay(),
            default => $start->copy()->addYearNoOverflow()->subDay(), // YEARLY
        };
    }
}
