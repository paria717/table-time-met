
import { CommonModule, } from '@angular/common';
import { Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';


@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, CommonModule

  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  protected readonly title = signal('table-time');
  isOpen = signal(false);
  menu = [
    { label: 'جدول', icon: 'pi pi-table', to: '/table' },
    { label: 'چارت', icon: 'pi pi-chart-line', to: '/chart' },
  ];

  toggle() { this.isOpen.update(v => !v); }
  close()  { this.isOpen.set(false); }

  @HostListener('document:keydown.escape') onEsc() { this.close(); }
}
