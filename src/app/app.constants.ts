import { ScheduleObject } from "./app.enums";

export const PAGE_MARGIN_LEFT_PERCENTAGE = 25;
export const PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN = 7;

export const MINUTES_IN_HOUR = 60;
export const HOURS_IN_DAY = 24;
export const DAYS_IN_WEEK = 7;
export const MAX_LESSON_DURATION = 5;

export const PHONE_NUMBER_LENGTH = 11;

export const STATUS_OPTIONS = [{ value: true, text: 'Активный' }, { value: false, text: 'Завершенный' }];

export const COMMUNICATION_OPTIONS = [
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' },
    { value: 'WhatsApp', text: 'WhatsApp', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Whatsapp%20Icon.png' },
    { value: 'Teams', text: 'Teams', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/MicrosoftTeams%20Icon.png' },
    { value: 'Profi', text: 'Profi', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Profi%20Icon.png' },
    { value: 'Телефон', text: 'Телефон', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Phone%20Icon.png' }
];

export const PLATFORM_OPTIONS = [
    { value: 'Zoom', text: 'Zoom', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Zoom%20Icon.png' },
    { value: 'Teams', text: 'Teams', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/MicrosoftTeams%20Icon.png' },
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' }
];

export const FROM_OPTIONS = [
    { value: 'Сова', text: 'Сова', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/owl.png' },
    { value: 'Profi', text: 'Profi', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Profi%20Icon.png' },
    { value: 'Авито', text: 'Авито', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Avito%20Icon.png' },
    { value: 'Сарафан', text: 'Сарафан', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Phone%20Icon.png' }
];

export const REPEAT_LESSON_OPTIONS = [
    { value: 'ONE', text: 'Только это занятие' },
    { value: 'FUTURE', text: 'Это и будущие занятия' }
]

export const MONTH_NAMES = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
export const SCHEDULE_OBJECT_OPTIONS = [{ value: ScheduleObject.Slot, text: "Добавить окно" }, { value: ScheduleObject.Lesson, text: "Добавить занятие" }]