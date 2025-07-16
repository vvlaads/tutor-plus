import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";
import { COMMUNICATION_OPTIONS, HOURS_IN_DAY, MAX_LESSON_DURATION, MINUTES_IN_HOUR, PAID_OPTIONS } from "../app.constants";
import { changeDateFormatMinusToDot, convertStringToDate, convertTimeToMinutes } from "./dates";
import { clearPhoneNumber } from "../app.functions";

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

export function parentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const hasParent = control.get('hasParent')?.value;
        if (hasParent) {
            const name = control.get('parentName')?.value;
            if (!name) {
                return { invalidParentName: true };
            }

            const phone = control.get('parentPhone')?.value;
            if (!phone) {
                return { invalidParentPhone: true };
            }

            const communication = control.get('parentCommunication')?.value;
            if (!communication) {
                return { invalidParentCommunication: true };
            }
            let communicationIsValid = false;
            for (let option of COMMUNICATION_OPTIONS) {
                if (option.value === communication) {
                    communicationIsValid = true;
                }
            }
            if (!communicationIsValid) {
                return { invalidParentCommunication: true };
            }
            const paid = control.get('paidByStudent')?.value;
            if (paid == null) {
                return { invalidPaidByStudent: true };
            }
            let paidIsValid = false;
            for (let option of PAID_OPTIONS) {
                if (option.value === paid) {
                    paidIsValid = true;
                }
            }
            if (!paidIsValid) {
                return { invalidPaidByStudent: true };
            }
        }
        return null;
    }
}

export function stopDateValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const isStopped = control.get('isStopped')?.value;
        if (isStopped) {
            const date = control.get('stopDate')?.value;
            if (!date) {
                return { invalidStopDate: true };
            }
        }
        return null;
    }
}

export function phoneNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (value) {
            const cleanedPhone = clearPhoneNumber(value);
            if (cleanedPhone.startsWith('+7')) {
                const pattern = (/^\+7\d{10}$/);
                return pattern.test(cleanedPhone) ? null : { invalidPhoneNumber: true };
            } else {
                const pattern = (/^\+\d{10,15}$/);
                return pattern.test(cleanedPhone) ? null : { invalidPhoneNumber: true };
            }
        }
        return null;
    }
}

export function correctYearValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;
        if (value) {
            const formattedDate = changeDateFormatMinusToDot(value);
            const date = convertStringToDate(formattedDate);
            const year = date.getFullYear();
            const currentYear = new Date().getFullYear()
            if (year < currentYear - 1 || year > currentYear + 1) {
                return { invalidYear: true };
            }
        }
        return null;
    }
}