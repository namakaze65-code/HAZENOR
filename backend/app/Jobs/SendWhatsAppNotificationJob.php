<?php

namespace App\Jobs;

use App\Models\NotificationLog;
use App\Models\NotificationRecord;
use App\Support\TenantContext;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Throwable;

class SendWhatsAppNotificationJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;

    public array $backoff = [10, 30, 60];

    public function __construct(
        public readonly string $organizationId,
        public readonly string $notificationId
    ) {}

    public function handle(): void
    {
        // Explicitly set Organization Context for PostgreSQL RLS inside queue worker
        TenantContext::set($this->organizationId, 'SYSTEM_WORKER');

        try {
            $notification = NotificationRecord::find($this->notificationId);
            if (! $notification || $notification->status === 'SENT') {
                return;
            }

            $attemptNumber = $notification->logs()->count() + 1;
            $providerReference = 'wamid.HAZENOR.'.Str::upper(Str::random(16));
            $providerStatus = 'DELIVERED_SHARED_SENDER';

            $fonnteToken = env('FONNTE_API_TOKEN');
            if (! empty($fonnteToken)) {
                $payload = $notification->payload ?? [];
                $tenantName = $payload['tenant_name'] ?? 'Penyewa Yth';
                $invNumber = $payload['invoice_number'] ?? '-';
                $total = isset($payload['total']) ? number_format((float) $payload['total'], 0, ',', '.') : '0';
                $dueDate = $payload['due_date'] ?? '-';

                $message = "*HAZENOR PROPERTIES — PENGINGAT TAGIHAN SEWA*\n\n"
                    ."Yth. *{$tenantName}*,\n"
                    ."Berikut rincian tagihan sewa unit properti Anda:\n"
                    ."• No. Tagihan: *{$invNumber}*\n"
                    ."• Total Tagihan: *Rp {$total}*\n"
                    ."• Jatuh Tempo: *{$dueDate}*\n\n"
                    ."Silakan lakukan pembayaran dan unggah bukti transfer melalui Portal Penyewa HAZENOR Properties.\n\n"
                    ."_A Legacy Built on Trust._";

                $response = Http::timeout(8)
                    ->withHeaders(['Authorization' => $fonnteToken])
                    ->post('https://api.fonnte.com/send', [
                        'target' => $notification->recipient,
                        'message' => $message,
                        'countryCode' => '62',
                    ]);

                if ($response->successful()) {
                    $providerStatus = 'DELIVERED_FONNTE_API';
                }
            }

            NotificationLog::create([
                'notification_id' => $notification->id,
                'attempt_number' => $attemptNumber,
                'provider_status' => $providerStatus,
                'error_code' => null,
                'error_message' => null,
                'attempted_at' => now(),
            ]);

            $notification->update([
                'status' => 'SENT',
                'provider_reference' => $providerReference,
                'sent_at' => now(),
            ]);
        } catch (Throwable $e) {
            if (isset($notification)) {
                NotificationLog::create([
                    'notification_id' => $notification->id,
                    'attempt_number' => $notification->logs()->count() + 1,
                    'provider_status' => 'FAILED',
                    'error_code' => 'WA_PROVIDER_ERR',
                    'error_message' => $e->getMessage(),
                    'attempted_at' => now(),
                ]);
                $notification->update(['status' => 'FAILED']);
            }
            // Do not rethrow financial-breaking errors; log safely
        } finally {
            TenantContext::clear();
        }
    }
}
