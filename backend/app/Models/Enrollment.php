<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Enrollment extends Model
{
    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_WITHDRAWN = 'withdrawn';

    protected $fillable = [
        'school_id', 'student_id', 'course_id', 'school_class_id', 'term', 'status', 'progress', 'grade', 'score', 'ca_score', 'exam_score', 'remark',
    ];

    protected function casts(): array
    {
        return [
            'ca_score' => 'float',
            'exam_score' => 'float',
            'score' => 'float',
            'progress' => 'integer',
        ];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function schoolClass(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'school_class_id');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }
}
