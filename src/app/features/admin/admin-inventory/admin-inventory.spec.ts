import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminInventory } from './admin-inventory';

describe('AdminInventory', () => {
  let component: AdminInventory;
  let fixture: ComponentFixture<AdminInventory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminInventory]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminInventory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
