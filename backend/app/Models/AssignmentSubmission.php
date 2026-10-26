<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AssignmentSubmission extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_SUBMITTED = 'submitted';

    public const STATUS_GRADED = 'graded';

    public const STATUS_OVERDUE = 'overdue';

    protected $fillable = [
        'assignment_id',
        'student_id',
        'status',
        'submission_text',
        'file_path',
        'submitted_at',
        'score',
        'feedback',
        'graded_at',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'score' => 'float',
            'submitted_at' => 'datetime',
            'graded_at' => 'datetime',
        ];
    }

    public function assignment(): BelongsTo
    {
        return $this->belongsTo(Assignment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /** The effective status, accounting for a pending row whose due date has passed. */
    public function effectiveStatus(): string
    {
        if (in_array($this->status, [self::STATUS_SUBMITTED, self::STATUS_GRADED], true)) {
            return $this->status;
        }

        if ($this->assignment && $this->assignment->due_at?->isPast()) {
            return self::STATUS_OVERDUE;
        }

        return self::STATUS_PENDING;
    }
}
