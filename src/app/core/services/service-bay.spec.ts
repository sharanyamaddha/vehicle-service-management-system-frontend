import { TestBed } from '@angular/core/testing';

import { ServiceBay } from './service-bay';

describe('ServiceBay', () => {
  let service: ServiceBay;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceBay);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
