<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ComplaintMessage extends Model
{
    use BelongsToOrganization, HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'organization_id',
        'complaint_id',
        'sender_user_id',
        'message',
    ];

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }
}
