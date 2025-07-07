import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, forwardRef, HostListener, OnInit } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { SelectOptionWithIcon } from '../../app.interfaces';
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
export class CustomSelectComponent implements ControlValueAccessor, OnInit {
  @Input()
  public options: SelectOptionWithIcon[] = [];
  @Input()
  public placeholder: string = 'Выберите...';
  @Input()
  public selectedValue: string | null = null;
  @Input()
  public disabled = false;
  @Output()
  public selected = new EventEmitter<SelectOptionWithIcon>();

  public selectedOption: SelectOptionWithIcon | null = null;
  public isOpen = false;

  private onChange: (value: string) => void = () => { };

  private onTouched: () => void = () => { };

  public ngOnInit(): void {
    if (this.selectedValue) {
      this.selectedOption = this.options.find(opt => opt.value === this.selectedValue) || null;
    }
  }

  public toggleDropdown(event: Event): void {
    if (this.disabled) return;
    event.stopPropagation();
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.onTouched();
    }
  }

  public selectOption(option: SelectOptionWithIcon, event: Event): void {
    event.stopPropagation();
    this.selectedOption = option;
    this.selected.emit(option);
    this.closeDropdown();
  }

  public writeValue(value: string): void {
    if (value) {
      this.selectedOption = this.options.find(opt => opt.value === value) || null;
    } else {
      this.selectedOption = null;
    }
  }

  public registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  public setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  @HostListener('document:click', ['$event'])
  public onClickOutside(event: Event): void {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.closeDropdown();
    }
  }

  @HostListener('document:keydown.escape')
  public onEscapePress(): void {
    this.closeDropdown();
  }

  private closeDropdown(): void {
    this.isOpen = false;
  }
}