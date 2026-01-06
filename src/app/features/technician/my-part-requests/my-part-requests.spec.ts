import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyPartRequests } from './my-part-requests';

describe('MyPartRequests', () => {
  let component: MyPartRequests;
  let fixture: ComponentFixture<MyPartRequests>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyPartRequests]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyPartRequests);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
