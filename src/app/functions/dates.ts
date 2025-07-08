import { DAYS_IN_WEEK, HOURS_IN_DAY, MINUTES_IN_HOUR } from "../app.constants";

export function changeDateFormatMinusToDot(minusFormat: string): string {
    const parts = minusFormat.split('-');
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];
    return `${day}.${month}.${year}`;
}

export function changeDateFormatDotToMinus(dotFormat: string): string {
    const parts = dotFormat.split('.');
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];
    return `${year}-${month}-${day}`;
}

export function convertMinutesToTime(minutes: number): string {
    if (minutes < 0 || minutes > (HOURS_IN_DAY * MINUTES_IN_HOUR - 1)) {
        throw new Error('Неверные значение минут');
    }

    const hours = Math.floor(minutes / 60);
    const correctMinutes = Math.floor(minutes % 60);

    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = correctMinutes < 10 ? `0${correctMinutes}` : correctMinutes;

    return `${formattedHours}:${formattedMinutes}`
}

export function convertTimeToMinutes(formattedTime: string): number {
    const parts = formattedTime.split(':');

    if (parts.length !== 2) {
        throw new Error('Неверный формат времени. Ожидалось: hh:mm');
    }

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Неверные значения времени');
    }

    if (hours >= HOURS_IN_DAY || minutes >= MINUTES_IN_HOUR || hours < 0 || minutes < 0) {
        throw new Error('Неверные данные времени');
    }

    return hours * MINUTES_IN_HOUR + minutes;
}

export function convertDateToString(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = month < 10 ? `0${month}` : month;

    return `${formattedDay}.${formattedMonth}.${year}`;
}

export function convertStringToDate(formattedDate: string): Date {
    const parts = formattedDate.split('.');

    if (parts.length !== 3) {
        throw new Error(`Неверный формат даты. Ожидалось: dd.mm.yyyy, получено: ${formattedDate}`);
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
        throw new Error('Неверные значения даты');
    }

    const date = new Date(year, month, day);

    if (
        date.getFullYear() !== year ||
        date.getMonth() !== month ||
        date.getDate() !== day
    ) {
        throw new Error('Неверные данные даты');
    }

    return date;
}

export function isDatesEquals(date1: Date, date2: Date): boolean {
    if (date1.getFullYear() === date2.getFullYear()) {
        if (date1.getMonth() === date2.getMonth()) {
            if (date1.getDate() === date2.getDate()) {
                return true;
            }
        }
    }
    return false;
}

export function getDatesBetween(start: Date, end: Date): Date[] {
    const dates = []
    let date = new Date(start)
    while (date.getTime() <= end.getTime()) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + DAYS_IN_WEEK);
    }

    return dates;
}