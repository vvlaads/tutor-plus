import { Component, forwardRef, Input, Output, EventEmitter, ElementRef, inject, OnChanges, SimpleChanges } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectOption } from '../../app.interfaces';

@Component({
  selector: 'app-search-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './search-select.component.html',
  styleUrls: ['./search-select.component.css'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchSelectComponent),
      multi: true,
    },
  ],
})
export class SearchSelectComponent implements ControlValueAccessor, OnChanges {
  private selectedOption: SelectOption | null = null;

  @Input()
  public options: SelectOption[] = [];
  @Input()
  public placeholder: string = 'Выберите...';
  @Output()
  public selected = new EventEmitter<string>();

  public searchQuery: string = '';
  public isOpen: boolean = false;
  public filteredOptions: SelectOption[] = [];
  private elementRef: ElementRef = inject(ElementRef);

  public ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] && this.selectedOption) {
      const matched = this.options.find(opt => opt.value === this.selectedOption?.value);
      if (matched) {
        this.selectedOption = matched;
        this.searchQuery = matched.text;
      }
    }
  }


  private onChange = (value: string | null) => { };
  private onTouched = () => { };

  public writeValue(value: string): void {
    if (value === null || value === undefined) {
      this.searchQuery = '';
      this.selectedOption = null;
      return;
    }

    const option = this.options.find((opt) => opt.value === value);
    if (option) {
      this.selectedOption = option;
      this.searchQuery = option.text;
    } else {
      // options пока нет, сохраняем pendingValue
      this.selectedOption = { value, text: '' };
      this.searchQuery = '';
    }
  }


  public registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  public registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  public filterOptions(): void {
    this.filteredOptions = this.options.filter((option) =>
      option.text.toLowerCase().includes(this.searchQuery.toLowerCase())
    );
  }

  public selectOption(option: SelectOption | null): void {
    if (!option) {
      this.searchQuery = '';
      this.selectedOption = null;
      this.onChange(null);
      return;
    }

    this.selectedOption = option;
    this.searchQuery = option.text;
    this.isOpen = false;

    this.onChange(option.value);
    this.onTouched();
    this.selected.emit(option.value);
  }

  public toggleDropdown(): void {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.filteredOptions = [...this.options];
    }
  }

  public onBlur(): void {
    setTimeout(() => {
      if (!this.isOpen) return;

      const activeElement = document.activeElement;
      if (!this.elementRef.nativeElement.contains(activeElement)) {
        this.isOpen = false;

        if (this.selectedOption?.value !== this.searchQuery) {
          this.searchQuery = this.selectedOption?.text || '';
        }
      }
    }, 200);
  }
}