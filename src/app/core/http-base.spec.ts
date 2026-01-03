import { TestBed } from '@angular/core/testing';

import { HttpBase } from './http-base';

describe('HttpBase', () => {
  let service: HttpBase;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HttpBase);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
