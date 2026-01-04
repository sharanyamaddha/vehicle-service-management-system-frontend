import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InventoryUsage } from './inventory-usage';

describe('InventoryUsage', () => {
  let component: InventoryUsage;
  let fixture: ComponentFixture<InventoryUsage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InventoryUsage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InventoryUsage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
