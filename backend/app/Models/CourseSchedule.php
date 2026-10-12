<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CourseSchedule extends Model
{
    protected $fillable = ['course_id', 'day_of_week', 'starts_at', 'ends_at', 'location', 'type'];

    public const DAYS = [1 => 'Monday', 2 => 'Tuesday', 3 => 'Wednesday', 4 => 'Thursday', 5 => 'Friday'];

    public function course(): BelongsTo
    {
        return $this->belongsTo(Course::class);
    }

    public function dayName(): string
    {
        return self::DAYS[$this->day_of_week] ?? 'Monday';
    }
}
