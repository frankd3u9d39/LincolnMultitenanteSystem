<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SchoolClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'school_id',
        'name',
        'code',
        'room',
        'schedule',
        'teacher_id',
    ];

    protected static function booted(): void
    {
        static::creating(function (SchoolClass $class): void {
            if (! $class->school_id && $class->teacher_id) {
                $teacher = User::find($class->teacher_id);
                if ($teacher && $teacher->school_id) {
                    $class->school_id = $teacher->school_id;
                }
            }
        });
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(Student::class, 'class_student');
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Course::class, 'class_subject', 'school_class_id', 'course_id')
            ->withPivot('teacher_id')
            ->withTimestamps();
    }

    public function classSubjects(): HasMany
    {
        return $this->hasMany(ClassSubject::class, 'school_class_id');
    }
}
