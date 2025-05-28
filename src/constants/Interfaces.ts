export interface TestResponse {
    test_id: number;
    student_id: number;
    score: number;
    responses: number[];
    wrong_questions: number[]; 
}

export interface Student {
    id: number;
    name: string;
    test_responses: TestResponse[];
}

export interface ClassRoom {
    id: number;
    name: string;
    students: Student[]
}

export interface UserState {
    name: string;
    email: string;
    classes: ClassRoom[]
}