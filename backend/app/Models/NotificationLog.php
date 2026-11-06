<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class NotificationLog extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $table = 'notification_logs';

    protected $fillable = [
        'notification_id',
        'attempt_number',
        'provider_status',
        'error_code',
        'error_message',
        'attempted_at',
    ];

    protected function casts(): array
    {
        return [
            'attempted_at' => 'datetime',
        ];
    }
}
