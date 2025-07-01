import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

interface SelectOption {
  value: string;
  text: string;
  icon?: string;
}

@Component({
  selector: 'app-custom-select',
  imports: [CommonModule],
  templateUrl: './custom-select.component.html',
  styleUrl: './custom-select.component.css'
})
export class CustomSelectComponent {
  @Input() options: SelectOption[] = [];
  @Input() placeholder: string = 'Выберите...';
  @Output() selected = new EventEmitter<SelectOption>();

  selectedOption: SelectOption | null = null;
  isOpen = false;

  toggleDropdown(event: Event) {
    event.stopPropagation(); // Предотвращаем всплытие события
    this.isOpen = !this.isOpen;
  }

  selectOption(option: SelectOption, event: Event) {
    event.stopPropagation();
    this.selectedOption = option;
    this.selected.emit(option);
    this.closeDropdown();
  }

  // Закрываем dropdown при клике вне компонента
  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.isOpen) return;
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select')) {
      this.closeDropdown();
    }
  }

  // Закрываем dropdown при нажатии ESC
  @HostListener('document:keydown.escape')
  onEscapePress() {
    this.closeDropdown();
  }

  private closeDropdown() {
    this.isOpen = false;
  }
}
