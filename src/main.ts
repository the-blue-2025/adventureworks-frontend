// Polyfill for $localize
(globalThis as any).$localize = (messageParts: TemplateStringsArray, ...expressions: any[]) => {
  let result = messageParts[0];
  for (let i = 0; i < expressions.length; i++) {
    result += expressions[i] + messageParts[i + 1];
  }
  return result;
};

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app';

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
