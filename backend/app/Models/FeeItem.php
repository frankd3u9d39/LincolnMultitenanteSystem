<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FeeItem extends Model
{
    protected $fillable = ['school_id', 'student_id', 'term', 'description', 'amount', 'paid_amount', 'due_date', 'required'];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date:Y-m-d',
        'required' => 'boolean',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(FeePayment::class);
    }

    public function outstanding(): float
    {
        return max(0, (float) $this->amount - (float) $this->paid_amount);
    }

    public function status(): string
    {
        if ($this->outstanding() <= 0) {
            return 'Paid';
        }

        return (float) $this->paid_amount > 0 ? 'Partial' : 'Unpaid';
    }
}
