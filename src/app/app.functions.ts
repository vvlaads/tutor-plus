import { AbstractControl, FormGroup, ValidatorFn } from '@angular/forms';

export function allowedValuesValidator(allowedOptions: any[], valueField = 'value'): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        const value = control.value;
        if (value === null || value === undefined) {
            return null;
        }
        const isValid = allowedOptions.some(option => option[valueField] === value);

        if (!isValid) {
            const allowedValues = allowedOptions.map(option => option[valueField]);
            return {
                allowedValues: {
                    value: control.value,
                    allowedValues,
                    options: allowedOptions
                }
            };
        }
        return null;
    };
}

export function getErrorMessage(formGroup: FormGroup, field: string): string | null {
    const control = formGroup.get(field);
    if (!control || !control.errors) return null;

    if (control.errors['required']) return '*Поле обязательно';
    if (control.errors['pattern']) return '*Неверный формат';
    if (control.errors['min']) return '*Слишком маленькое значение';
    if (control.errors['allowedValues']) return '*Недопустимое значение';
    if (control.errors['invalidDate']) return '*Недопустимая дата';

    return null;
}


export function generateColor(): string {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    const hexR = r.toString(16).padStart(2, '0');
    const hexG = g.toString(16).padStart(2, '0');
    const hexB = b.toString(16).padStart(2, '0');

    return `#${hexR}${hexG}${hexB}`;
}

export function formatPhoneNumber(phone: string): string {
    const digitsOnly = phone.replace(/\D/g, '');

    if (!digitsOnly.startsWith('7') || digitsOnly.length !== 11) {
        throw new Error('Неверный формат номера. Ожидается: +7XXXXXXXXXX (11 цифр)');
    }
    return `+7 (${digitsOnly.substring(1, 4)}) ${digitsOnly.substring(4, 7)}-${digitsOnly.substring(7, 9)}-${digitsOnly.substring(9)}`;
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

export function dateToString(date: Date): string {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();

    const formattedDay = day < 10 ? `0${day}` : day;
    const formattedMonth = month < 10 ? `0${month}` : month;

    return `${formattedDay}.${formattedMonth}.${year}`;
}

export function stringToDate(formattedDate: string): Date {
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

export function minutesToString(minutes: number): string {
    if (minutes < 0 || minutes > 1439) {
        throw new Error('Неверные значение минут');
    }

    const hours = Math.floor(minutes / 60);
    const correctMinutes = Math.floor(minutes % 60);

    const formattedHours = hours < 10 ? `0${hours}` : hours;
    const formattedMinutes = correctMinutes < 10 ? `0${correctMinutes}` : correctMinutes;

    return `${formattedHours}:${formattedMinutes}`
}

export function stringToMinutes(formattedTime: string): number {
    const parts = formattedTime.split(':');

    if (parts.length !== 2) {
        throw new Error('Неверный формат времени. Ожидалось: hh:mm');
    }

    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);

    if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Неверные значения времени');
    }

    if (hours > 23 || minutes > 60 || hours < 0 || minutes < 0) {
        throw new Error('Неверные данные времени');
    }

    return hours * 60 + minutes;
}

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

export function getDatesBetween(start: Date, end: Date): Date[] {
    const dates = []
    let date = new Date(start)
    while (date.getTime() <= end.getTime()) {
        dates.push(new Date(date));
        date.setDate(date.getDate() + 7);
    }

    return dates;
}