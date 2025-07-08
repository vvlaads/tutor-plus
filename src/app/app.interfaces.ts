export interface Lesson {
    id: string;
    studentId: string;
    date: string;
    startTime: string;
    endTime: string;
    cost: number;
    isPaid: boolean;
    isRepeat: boolean;
    realEndTime: string | null;
    note: string | null;
    baseLessonId: string | null;
    repeatEndDate: string | null;
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
    isRepeat: boolean;
    baseSlotId: string | null;
    repeatEndDate: string | null;
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