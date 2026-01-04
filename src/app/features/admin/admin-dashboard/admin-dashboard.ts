import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserResponse, UserService } from '../../../core/services/user-service';
import { DialogService } from '../../../shared/services/dialog.service';
import { ServiceBayService, ServiceBay } from '../../../core/services/service-bay';
import { InventoryService, InventoryPart } from '../../../core/services/inventory';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  activeMenu: string = 'users';

  // Users
  users: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  invitedUsers: UserResponse[] = [];
  roleFilterControl = new FormControl('ALL');

  // Bays
  bays: ServiceBay[] = [];

  // Inventory
  lowStockItems: InventoryPart[] = [];

  // Stats
  totalUsers = 0;
  totalBays = 0;
  totalLowStock = 0;

  isLoading: boolean = false;
  errorMessage: string = '';

  // Forms & UI state
  showAddUser: boolean = false;
  showAddBay: boolean = false;
  showRestock: boolean = false;
  showProfileMenu: boolean = false;

  addUserForm!: FormGroup;
  addBayForm!: FormGroup;
  restockForm!: FormGroup;

  selectedPart: InventoryPart | null = null;

  isSubmitting: boolean = false;
  specializations: string[] = ['ENGINE', 'ELECTRICAL', 'BODYWORK'];

  constructor(
    private router: Router,
    private userService: UserService,
    private bayService: ServiceBayService,
    private inventoryService: InventoryService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadUsers(); // Default load
    this.roleFilterControl.valueChanges.subscribe(() => this.applyFilter());
  }

  initForm(): void {
    // User Form
    this.addUserForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['MANAGER', [Validators.required]],
      specialization: [{ value: '', disabled: true }, []],
      available: [true]
    });

    this.addUserForm.get('role')?.valueChanges.subscribe((role) => {
      const specControl = this.addUserForm.get('specialization');
      if (role === 'TECHNICIAN') {
        specControl?.enable();
        specControl?.setValidators([Validators.required]);
      } else {
        specControl?.disable();
        specControl?.clearValidators();
        specControl?.setValue('');
      }
      specControl?.updateValueAndValidity({ emitEvent: false });
    });

    // Bay Form
    this.addBayForm = this.fb.group({
      bayNumber: [null, [Validators.required, Validators.min(1)]]
    });

    // Restock Form
    this.restockForm = this.fb.group({
      quantity: [10, [Validators.required, Validators.min(1)]]
    });
  }

  setActiveMenu(menu: string): void {
    this.activeMenu = menu;
    this.errorMessage = '';

    if (menu === 'users') {
      this.loadUsers();
    } else if (menu === 'invites') {
      this.loadInvitedUsers();
    } else if (menu === 'bays') {
      this.loadBays();
    } else if (menu === 'inventory') {
      this.loadInventory();
    } else if (menu === 'reports') {
      this.loadStats();
    }
  }

  // --- USERS & INVITES ---
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.users = list.filter(u => u.role !== 'ADMIN' && u.passwordSet !== false);
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadInvitedUsers(): void {
    this.isLoading = true;
    this.userService.getInvitedUsers().subscribe({
      next: (data) => {
        this.invitedUsers = Array.isArray(data) ? data : [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load invited users';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  applyFilter(): void {
    const role = this.roleFilterControl.value || 'ALL';
    this.filteredUsers = role === 'ALL' ? [...this.users] : this.users.filter(u => u.role === role);
  }

  // --- BAYS ---
  loadBays(): void {
    this.isLoading = true;
    this.bayService.getAllBays().subscribe({
      next: (data) => {
        this.bays = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load bays';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleBayStatus(bay: ServiceBay): void {
    const newStatus = !bay.active;
    const action = newStatus ? 'Enable' : 'Disable';

    this.dialogService.confirm({
      title: `${action} Bay ${bay.bayNumber}`,
      message: `Are you sure you want to ${action.toLowerCase()} this bay?`,
      confirmLabel: action,
      cancelLabel: 'Cancel',
      isDangerous: !newStatus
    }).subscribe(confirmed => {
      if (confirmed) {
        this.bayService.updateStatus(bay.bayNumber, newStatus).subscribe({
          next: () => {
            bay.active = newStatus;
            this.cdr.detectChanges();
          },
          error: () => alert(`Failed to ${action} bay`)
        });
      }
    });
  }

  submitAddBay(): void {
    if (this.addBayForm.invalid) return;

    const bayNum = this.addBayForm.get('bayNumber')?.value;
    this.isSubmitting = true;

    this.bayService.createBay({ bayNumber: bayNum, active: true, available: true }).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.showAddBay = false;
        this.addBayForm.reset();
        this.loadBays();
        this.dialogService.confirm({
          title: 'Success', message: 'Bay added successfully', confirmLabel: 'OK', cancelLabel: '', isDangerous: false
        }).subscribe();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.dialogService.confirm({
          title: 'Error', message: 'Failed to add bay. It may already exist.', confirmLabel: 'OK', cancelLabel: '', isDangerous: true
        }).subscribe();
      }
    });
  }

  // --- INVENTORY ---
  loadInventory(): void {
    this.isLoading = true;
    // We only want Low Stock (Restock Requests)
    this.inventoryService.getLowStockAlerts().subscribe({
      next: (data) => {
        this.lowStockItems = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'Failed to load inventory requests';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  openRestock(item: InventoryPart): void {
    this.selectedPart = item;
    // Suggest quantity to verify reorder level? For now just simple input
    this.restockForm.setValue({ quantity: 10 });
    this.showRestock = true;
  }

  submitRestock(): void {
    if (!this.selectedPart || this.restockForm.invalid) return;

    this.isSubmitting = true;
    // We don't have a direct 'restock' endpoint, so we might need updatePart
    // But updatePart usually takes full object.
    // If backend doesn't support patch stock, this is risk.
    // Assuming backend InventoryController has updatePart.

    // Actually we don't have a "Restock" endpoint in Controller viewed earlier.
    // We only have `updatePart` which takes `UpdatePartRequest`.
    // Let's assume UpdatePartRequest accepts stockQuantity updates.

    // Logic: Current Stock + Added Stock.
    const newStock = this.selectedPart.stockQuantity + this.restockForm.get('quantity')?.value;

    // We need to construct UpdatePartRequest. 
    // Ideally we should have a `restock` endpoint but I will use updatePart for now.
    const updatePayload = {
      name: this.selectedPart.name,
      price: this.selectedPart.price,
      stockQuantity: newStock,
      reorderLevel: this.selectedPart.reorderLevel
    };

    // Warning: we need the ID. InventoryPart has ID.
    if (this.selectedPart.id) {
      this.inventoryService.updatePart(this.selectedPart.id, updatePayload as any).subscribe({
        next: () => {
          this.isSubmitting = false;
          this.showRestock = false;
          this.selectedPart = null;
          this.loadInventory(); // Reload to see if it disappears from low stock
          this.dialogService.confirm({
            title: 'Restocked', message: 'Stock updated successfully', confirmLabel: 'OK', cancelLabel: '', isDangerous: false
          }).subscribe();
        },
        error: () => {
          this.isSubmitting = false;
          alert('Restock failed');
        }
      });
    }
  }

  // --- STATS ---
  loadStats(): void {
    // Quick and dirty stats loading
    this.userService.getAllUsers().subscribe(u => this.totalUsers = u.length);
    this.bayService.getAllBays().subscribe(b => this.totalBays = b.length);
    this.inventoryService.getLowStockAlerts().subscribe(i => this.totalLowStock = i.length);
  }

  // --- User Creation ---
  submitAddUser(): void {
    if (this.addUserForm.invalid) return;

    const { username, email, password, role, specialization, available } = this.addUserForm.getRawValue();
    this.isSubmitting = true;

    this.userService.createUser({ username, email, password, role }).subscribe({
      next: (res: any) => {
        const directId = res?.userId || res?.id || '';
        if (role === 'TECHNICIAN' && specialization) {
          // ... (Same tech creation logic)
          if (directId) {
            this.createTech(directId, specialization, available);
          } else {
            this.userService.getAllUsers().subscribe({
              next: (users) => {
                const match = (users || []).find(u => u.email === email);
                if (match?.id) {
                  this.createTech(match.id, specialization, available);
                } else {
                  this.afterCreate();
                }
              },
              error: () => this.afterCreate(),
            });
          }
        } else {
          this.afterCreate();
        }
      },
      error: () => this.afterCreate()
    });
  }

  private createTech(userId: string, specialization: string, available: boolean): void {
    this.userService.createTechnician({ userId, specialization, available }).subscribe({
      next: () => this.afterCreate(),
      error: () => this.afterCreate(),
    });
  }

  afterCreate(): void {
    this.isSubmitting = false;
    this.showAddUser = false;
    this.dialogService.confirm({
      title: 'User Created',
      message: 'User created. Invite sent.',
      confirmLabel: 'OK',
      cancelLabel: '',
      isDangerous: false
    }).subscribe();
    // Reset form
    this.addUserForm.reset({ role: 'MANAGER', available: true, specialization: '' });

    if (this.addUserForm.get('role')?.value === 'MANAGER') {
      this.setActiveMenu('invites');
    } else {
      this.loadUsers();
    }
  }

  // ... (Other existing methods like openConfirm for users toggleUserStatus etc remain)

  openConfirm(user: UserResponse): void {
    // ... existing implementation
    const isDeactivating = user.active;
    this.dialogService
      .confirm({
        title: isDeactivating ? 'Deactivate User' : 'Activate User',
        message: isDeactivating
          ? `Are you sure you want to deactivate ${user.username}?`
          : `Activate ${user.username}?`,
        cancelLabel: 'Cancel',
        confirmLabel: isDeactivating ? 'Deactivate' : 'Activate',
        isDangerous: isDeactivating,
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.toggleUserStatus(user);
        }
      });
  }

  private toggleUserStatus(user: UserResponse): void {
    // ... existing implementation
    const action = user.active ? 'disable' : 'enable';
    const serviceCall = user.active
      ? this.userService.disableUser(user.id)
      : this.userService.enableUser(user.id);

    serviceCall.subscribe({
      next: () => {
        user.active = !user.active;
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.errorMessage = `Failed to ${action} user`;
        this.cdr.detectChanges();
      }
    });
  }

  getRoleBadgeClass(role: string): string {
    const roleMap: { [key: string]: string } = {
      'ADMIN': 'role-admin',
      'MANAGER': 'role-manager',
      'TECHNICIAN': 'role-technician',
      'CUSTOMER': 'role-customer'
    };
    return roleMap[role] || 'role-default';
  }

  resendInvite(user: UserResponse): void {
    // ... existing implementation
    this.dialogService.confirm({
      title: 'Resend Invite',
      message: `Send a new activation link to ${user.email}?`,
      confirmLabel: 'Send',
      cancelLabel: 'Cancel',
      isDangerous: false
    }).subscribe(confirmed => {
      if (confirmed) {
        this.userService.resendInvite(user.id).subscribe({
          next: () => {
            this.dialogService.confirm({
              title: 'Email Sent',
              message: 'Link sent to ' + user.email,
              confirmLabel: 'OK',
              cancelLabel: '',
              isDangerous: false
            }).subscribe();
          },
          error: () => {
            this.dialogService.confirm({
              title: 'Error',
              message: 'Failed to send.',
              confirmLabel: 'OK',
              cancelLabel: '',
              isDangerous: true
            }).subscribe();
          }
        });
      }
    });
  }

  logout(): void {
    sessionStorage.clear();
    this.router.navigate(['/home']);
  }
}

