import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer mt-auto py-3 bg-light border-top">
      <div class="container text-center">
        <span class="text-muted">&copy; {{ year }} AdventureWorks Data Management. All rights reserved.</span>
      </div>
    </footer>
  `
})
export class FooterComponent {
  year = new Date().getFullYear();
} 