import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, forwardRef, HostListener } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface SelectOption {
  value: string;
  text: string;
  icon?: string;
}

@Component({
  selector: 'app-custom-select',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './custom-select.component.html',
  styleUrls: ['./custom-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CustomSelectComponent),
      multi: true
    }
  ]
})
export class CustomSelectComponent implements ControlValueAccessor {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Выберите...';
  @Input() selectedValue: string | null = null;
  @Input() disabled = false;
  @Output() selected = new EventEmitter<SelectOption>();

  selectedOption: SelectOption | null = null;
  isOpen = false;

  // Функции для ControlValueAccessor
  private onChange: (value: string) => void = () => { };
  private onTouched: () => void = () => { };
  ngOnInit() {
    if (this.selectedValue) {
      this.selectedOption = this.options.find(opt => opt.value === this.selectedValue) || null;
    }
  }
  toggleDropdown(event: Event) {
    if (this.disabled) return;
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.onTouched();
    }
  }

  selectOption(option: SelectOption, event: Event) {
    event.stopPropagation();
    this.selectedOption = option;
    this.selected.emit(option); // Здесь передается весь объект option
    this.closeDropdown();
  }

  // ControlValueAccessor методы
  writeValue(value: string): void {
    if (value) {
      this.selectedOption = this.options.find(opt => opt.value === value) || null;
    } else {
      this.selectedOption = null;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.closeDropdown();
  }

  private closeDropdown() {
    this.isOpen = false;
  }
}