import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <header class="app-header">
      <span>CRUD Veículos</span>
    </header>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
  styles: [
    `
      .app-header {
        background: #1976d2;
        color: #fff;
        padding: 1rem 2rem;
        font-size: 1.25rem;
        font-weight: 700;
      }
      main {
        padding: 0;
      }
    `,
  ],
})
export class AppComponent {}
