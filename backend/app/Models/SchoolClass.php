<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SchoolClass extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'room',
        'schedule',
        'teacher_id'
    ];

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function students()
    {
        return $this->belongsToMany(Student::class, 'class_student');
    }

    public function subjects()
    {
        return $this->belongsToMany(Course::class, 'class_subject', 'school_class_id', 'course_id')
            ->withPivot('teacher_id')
            ->withTimestamps();
    }
}
