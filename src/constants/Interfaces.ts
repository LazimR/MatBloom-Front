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
    teacher_ids: number[];
    students: Student[]
}

export interface UserState {
    id: number | null;
    username: string;
    email: string;
    role: string;
    classes: ClassRoom[]
}

export interface AuthSession {
    authenticated: boolean;
    user: {
        id: number;
        username: string;
        email: string;
        role: string;
        classes: ClassRoom[];
    };
}
