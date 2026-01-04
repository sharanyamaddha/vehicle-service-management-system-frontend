import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminInvites } from './admin-invites';

describe('AdminInvites', () => {
  let component: AdminInvites;
  let fixture: ComponentFixture<AdminInvites>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminInvites]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminInvites);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
