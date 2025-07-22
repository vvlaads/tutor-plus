import { CollectionOption, ScheduleObject } from "./app.enums";

export const PAGE_MARGIN_LEFT_PERCENTAGE = 20;
export const PAGE_MARGIN_LEFT_PERCENTAGE_HIDDEN = 5;

export const MINUTES_IN_HOUR = 60;
export const SECONDS_IN_MINUTE = 60;
export const HOURS_IN_DAY = 24;
export const DAYS_IN_WEEK = 7;
export const MAX_LESSON_DURATION = 5;
export const MILLISECONDS_IN_SECOND = 1000;

export const PHONE_NUMBER_LENGTH = 11;
export const DESKTOP_VISIBLE_LESSONS_COUNT = 3;
export const MOBILE_VISIBLE_LESSONS_COUNT = 1;
export const BLOCK_HEIGHT_IN_PIXELS = 60;
export const HEADER_HEIGHT_IN_PIXELS = 30;
export const BLOCK_WIDTH_PERCENTAGE = 13;
export const TIME_COLUMN_WIDTH_PERCENTAGE = 9;

export const STATUS_OPTIONS = [{ value: true, text: 'Активный' }, { value: false, text: 'Завершенный' }];
export const PAID_OPTIONS = [{ value: true, text: 'Студент' }, { value: false, text: 'Родитель' }];

export const COMMUNICATION_OPTIONS = [
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' },
    { value: 'WhatsApp', text: 'WhatsApp', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Whatsapp%20Icon.png' },
    { value: 'Teams', text: 'Teams', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/MicrosoftTeams%20Icon.png' },
    { value: 'Profi', text: 'Profi', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Profi%20Icon.png' },
    { value: 'Авито', text: 'Авито', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Avito%20Icon.png' },
    { value: 'Телефон', text: 'Телефон', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Phone%20Icon.png' }
];

export const PLATFORM_OPTIONS = [
    { value: 'Zoom', text: 'Zoom', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Zoom%20Icon.png' },
    { value: 'Teams', text: 'Teams', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/MicrosoftTeams%20Icon.png' },
    { value: 'Telegram', text: 'Telegram', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Telegram%20Icon.png' },
    { value: 'Дома', text: 'Дома', icon: 'https://raw.githubusercontent.com/vvlaads/tutor-plus-resources/main/Home%20Icon%20Black.png' }
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

export const REPEAT_SLOT_OPTIONS = [
    { value: 'ONE', text: 'Только это окно' },
    { value: 'FUTURE', text: 'Это и будущие окна' }
]


export const MONTH_NAMES = ["Января", "Февраля", "Марта", "Апреля", "Мая", "Июня", "Июля", "Августа", "Сентября", "Октября", "Ноября", "Декабря"];
export const LOWER_MONTH_NAMES = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"];
export const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
export const WEEKDAY_FULL_NAMES = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
export const TIMES = ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
export const SCHEDULE_OBJECT_OPTIONS = [
    { value: ScheduleObject.Slot, text: "Добавить окно" },
    { value: ScheduleObject.Lesson, text: "Добавить занятие" }
]

export const ADMIN_COLLECTIONS_OPTIONS = [
    { value: CollectionOption.SELECT, text: "Выбрать" },
    { value: CollectionOption.EDIT, text: "Изменить" }
]

export const GUEST_COLLECTIONS_OPTIONS = [
    { value: CollectionOption.SELECT, text: "Выбрать" },
]

export const MAX_COLLECTIONS_COUNT = 6;