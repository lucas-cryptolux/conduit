import { ValidatorFn } from '@angular/forms';

export interface Field {
  type: FieldType;
  name: string;
  label?: string;
  placeholder?: string;
  validator?: ValidatorFn[];
  attrs?: any;
  settings?: any;
  options?: any[];
}

export type FieldType = 'INPUT' | 'TEXTAREA' | 'MULTISELECT';

export interface Errors {
  [key: string]: string;
}
