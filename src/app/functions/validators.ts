import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { HOURS_IN_DAY, MAX_LESSON_DURATION, MINUTES_IN_HOUR } from "../app.constants";
import { changeDateFormatMinusToDot, convertStringToDate, convertTimeToMinutes } from "./dates";

export function timeRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const startTime = control.get('startTime')?.value;
        const endTime = control.get('endTime')?.value;
        if (startTime && endTime) {
            const start = convertTimeToMinutes(startTime);
            const end = convertTimeToMinutes(endTime);
            if (start >= end) {
                return { timeRangeInvalid: true };
            }
        }
        return null;
    }
}

export function requiredRepeatDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const isRepeat = control.get('isRepeat')?.value;
        if (isRepeat) {
            const date = control.get('repeatEndDate')?.value;
            if (!date) {
                return { repeatEndDateInvalid: true };
            }
        }
        return null;
    }
}

export function repeatDateRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const isRepeat = control.get('isRepeat')?.value;
        if (isRepeat) {
            let date = control.get('repeatEndDate')?.value;
            let startDate = control.get('date')?.value;
            if (date && startDate) {
                date = changeDateFormatMinusToDot(date);
                startDate = changeDateFormatMinusToDot(startDate);
                if (convertStringToDate(date).getTime() <= convertStringToDate(startDate).getTime()) {
                    return { repeatEndDateInvalid: true };
                }
            }
        }
        return null;
    }
}

export function requiredRealEndTimeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const hasRealEndTime = control.get('hasRealEndTime')?.value;
        if (hasRealEndTime) {
            const time = control.get('realEndTime')?.value;
            if (!time) {
                return { realEndTimeInvalid: true };
            }
            return null;
        }
        return null;
    }
}

export function realEndTimeRangeValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const hasRealEndTime = control.get('hasRealEndTime')?.value;
        if (hasRealEndTime) {
            const realEndTime = control.get('realEndTime')?.value;
            const startTime = control.get('startTime')?.value;
            if (realEndTime && startTime) {
                const start = convertTimeToMinutes(startTime);
                const realEnd = convertTimeToMinutes(realEndTime);
                if (realEnd > start) {
                    return null;
                }
                if ((realEnd + HOURS_IN_DAY * MINUTES_IN_HOUR) > (start + MAX_LESSON_DURATION * MINUTES_IN_HOUR)) {
                    return { realEndTimeInvalid: true };
                }
            }
        }
        return null;
    }
}

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