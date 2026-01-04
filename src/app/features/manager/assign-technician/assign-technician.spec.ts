import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AssignTechnician } from './assign-technician';

describe('AssignTechnician', () => {
  let component: AssignTechnician;
  let fixture: ComponentFixture<AssignTechnician>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AssignTechnician]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AssignTechnician);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
