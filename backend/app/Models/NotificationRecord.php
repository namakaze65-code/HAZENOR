<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class NotificationRecord extends Model
{
    use BelongsToOrganization, HasUuids;

    public $timestamps = false;

    protected $table = 'notifications';

    protected $fillable = [
        'organization_id',
        'user_id',
        'channel',
        'template_key',
        'recipient',
        'payload',
        'status',
        'provider_reference',
        'sent_at',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'payload' => 'array',
            'sent_at' => 'datetime',
            'read_at' => 'datetime',
        ];
    }

    public function logs(): HasMany
    {
        return $this->hasMany(NotificationLog::class, 'notification_id');
    }
}
