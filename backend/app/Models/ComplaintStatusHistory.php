<?php

namespace App\Models;

use App\Models\Concerns\BelongsToOrganization;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class ComplaintStatusHistory extends Model
{
    use BelongsToOrganization, HasUuids;

    public $timestamps = false;

    protected $table = 'complaint_status_history';

    protected $fillable = [
        'organization_id',
        'complaint_id',
        'old_status',
        'new_status',
        'changed_by',
        'note',
    ];
}
