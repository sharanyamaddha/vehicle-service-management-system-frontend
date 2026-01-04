import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBays } from './admin-bays';

describe('AdminBays', () => {
  let component: AdminBays;
  let fixture: ComponentFixture<AdminBays>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminBays]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminBays);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
