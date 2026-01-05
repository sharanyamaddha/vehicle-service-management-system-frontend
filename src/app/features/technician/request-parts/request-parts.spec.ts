import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RequestParts } from './request-parts';

describe('RequestParts', () => {
  let component: RequestParts;
  let fixture: ComponentFixture<RequestParts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RequestParts]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RequestParts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
