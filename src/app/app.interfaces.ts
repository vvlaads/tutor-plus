export interface Lesson {
    id: string;
    studentId: string;
    date: string;
    startTime: string;
    endTime: string;
    cost: number;
    isPaid: boolean;
    isRepeat: boolean;
    baseLessonId: string | null;
    repeatEndDate: string | null;
    hasRealEndTime: boolean;
    realEndTime: string | null;
    note: string | null;
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
    hasParent: boolean;
    parentName: string | null;
    parentPhone: string | null;
    parentCommunication: string | null;
    paidByStudent: boolean;
    isStopped: boolean;
    stopDate: string | null;
    note: string | null;
}

export interface Slot {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    isRepeat: boolean;
    baseSlotId: string | null;
    repeatEndDate: string | null;
    hasRealEndTime: boolean;
    realEndTime: string | null;
}

export interface TimeBlock {
    date: string;
    startTime: string;
    endTime: string;
}

export interface WaitingBlock {
    id: string;
    studentId: string;
    date: string;
    note: string;
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