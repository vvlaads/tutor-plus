export interface Lesson {
    id: string;
    studentId: string;
    date: string;
    startTime: string;
    endTime: string;
    cost: number;
    isPaid: boolean;
    realEndTime?: string;
}

export interface Student {
    id: string;
    name: string;
    phone: string;
    subject: string;
    communication: string;
    platform: string;
    cost: number;
    isActive: boolean;
    from: string;
    color: string;
}

export interface Slot {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
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