export interface Lesson {
    id: string;
    studentId: string;
    date: string;
    startTime: string;
    endTime: string;
    cost: number;
    isPaid: boolean;
}

export interface Student {
    id: string;
    name: string;
    phone: string;
    subject: string;
    communication: string;
    platform: string;
    cost: number;
    isActual: boolean;
}

export interface SelectOptionWithIcon {
    value: string;
    text: string;
    icon: string;
}

export interface SelectOption {
    value: string;
    text: string;
}