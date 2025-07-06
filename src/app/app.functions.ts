import { AbstractControl, ValidatorFn } from '@angular/forms';

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