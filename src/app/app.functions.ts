import { FormGroup } from '@angular/forms';
import { PHONE_NUMBER_LENGTH } from './app.constants';

export function getErrorMessage(formGroup: FormGroup, field: string): string | null {
    const control = formGroup.get(field);
    if (!control || !control.errors) return null;

    if (control.errors['required']) return '*Поле обязательно';
    if (control.errors['pattern']) return '*Неверный формат';
    if (control.errors['min']) return '*Слишком маленькое значение';
    if (control.errors['allowedValues']) return '*Недопустимое значение';
    if (control.errors['invalidPhoneNumber']) return '*Неверный номер телефона';
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

    if (!digitsOnly.startsWith('7') || digitsOnly.length !== PHONE_NUMBER_LENGTH) {
        throw new Error(`Неверный формат номера. Ожидается: +7XXXXXXXXXX (${PHONE_NUMBER_LENGTH} цифр)`);
    }
    return `+7 (${digitsOnly.substring(1, 4)}) ${digitsOnly.substring(4, 7)}-${digitsOnly.substring(7, 9)}-${digitsOnly.substring(9)}`;
}

export function clearPhoneNumber(phone: string) {
    const cleanedPhone = phone.replace(/[^\d+]/g, '');
    return cleanedPhone;
}