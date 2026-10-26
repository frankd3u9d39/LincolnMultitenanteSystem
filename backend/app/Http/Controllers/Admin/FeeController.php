<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\FeeItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * GROUP 3: Admin Module - fee schedules for the school's students.
 */
class FeeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $items = FeeItem::where('school_id', $school->id)
            ->with('student:id,name,email')
            ->latest('due_date')
            ->paginate((int) $request->integer('per_page', 25));

        return response()->json([
            'data' => collect($items->items())->map(fn (FeeItem $i) => [
                'id' => $i->id,
                'student' => $i->student?->name,
                'studentId' => $i->student_id,
                'term' => $i->term,
                'description' => $i->description,
                'amount' => (float) $i->amount,
                'paid' => (float) $i->paid_amount,
                'outstanding' => $i->outstanding(),
                'status' => $i->status(),
                'dueDate' => $i->due_date->toDateString(),
            ]),
            'meta' => [
                'currentPage' => $items->currentPage(),
                'lastPage' => $items->lastPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $school = $request->user()->school;

        $data = $request->validate([
            'studentId' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where('school_id', $school->id)->where('role', User::ROLE_STUDENT),
            ],
            'term' => ['required', 'string', 'max:60'],
            'description' => ['required', 'string', 'max:150'],
            'amount' => ['required', 'numeric', 'min:0.01', 'max:1000000'],
            'dueDate' => ['required', 'date'],
            'required' => ['sometimes', 'boolean'],
        ]);

        $item = FeeItem::create([
            'school_id' => $school->id,
            'student_id' => $data['studentId'],
            'term' => $data['term'],
            'description' => $data['description'],
            'amount' => $data['amount'],
            'paid_amount' => 0,
            'due_date' => $data['dueDate'],
            'required' => $data['required'] ?? true,
        ]);

        return response()->json(['data' => ['id' => $item->id]], 201);
    }
}
