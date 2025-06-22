// Polyfill for $localize (needed for SSR)
(globalThis as any).$localize = (messageParts: TemplateStringsArray, ...expressions: any[]) => {
  let result = messageParts[0];
  for (let i = 0; i < expressions.length; i++) {
    result += expressions[i] + messageParts[i + 1];
  }
  return result;
};

import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { config } from './app/app.config.server';

const bootstrap = () => bootstrapApplication(AppComponent, config);

export default bootstrap;
