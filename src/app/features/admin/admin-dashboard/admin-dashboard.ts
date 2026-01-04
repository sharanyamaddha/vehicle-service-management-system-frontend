import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserResponse, UserService } from '../../../core/services/user-service';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
})
export class AdminDashboard implements OnInit {
  activeMenu: string = 'users';
  users: UserResponse[] = [];
  filteredUsers: UserResponse[] = [];
  roleFilterControl = new FormControl('ALL');
  isLoading: boolean = false;
  errorMessage: string = '';
  showAddUser: boolean = false;
  addUserForm!: FormGroup;
  isSubmitting: boolean = false;
  specializations: string[] = ['ENGINE', 'ELECTRICAL', 'BODYWORK'];

  constructor(
    private router: Router,
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.roleFilterControl.valueChanges.subscribe(() => this.applyFilter());
    this.initForm();
  }

  initForm(): void {
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
  }

  setActiveMenu(menu: string): void {
    this.activeMenu = menu;
    if (menu === 'users') {
      this.loadUsers();
    }
  }

  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();

    this.userService.getAllUsers().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : [];
        this.users = list.filter(u => u.role !== 'ADMIN');
        this.applyFilter();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
        this.cdr.detectChanges();
        console.error('Error loading users:', error);
      },
    });
  }

  applyFilter(): void {
    const role = this.roleFilterControl.value || 'ALL';
    if (role === 'ALL') {
      this.filteredUsers = [...this.users];
    } else {
      this.filteredUsers = this.users.filter(u => u.role === role);
    }
    this.cdr.detectChanges();
  }

  submitAddUser(): void {
    if (this.addUserForm.invalid) {
      this.addUserForm.markAllAsTouched();
      return;
    }

    const { username, email, password, role, specialization, available } = this.addUserForm.getRawValue();
    this.isSubmitting = true;
    this.cdr.detectChanges();

    this.userService.createUser({ username, email, password, role }).subscribe({
      next: (res: any) => {
        const directId = res?.userId || res?.id || '';
        if (role === 'TECHNICIAN' && specialization) {
          if (directId) {
            this.createTech(directId, specialization, available);
          } else {
            // fallback: refetch users and find by email
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
      error: () => {
        this.afterCreate();
      }
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
    this.addUserForm.reset({ role: 'MANAGER', available: true, specialization: '' });
    this.loadUsers();
    this.cdr.detectChanges();
  }

  openConfirm(user: UserResponse): void {
    const isDeactivating = user.active;
    this.dialogService
      .confirm({
        title: isDeactivating ? 'Deactivate User' : 'Activate User',
        message: isDeactivating
          ? `Are you sure you want to deactivate ${user.username}? They will not be able to login.`
          : `Are you sure you want to activate ${user.username}? They will regain access.`,
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
        console.error(`Error ${action} user:`, error);
      },
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
}

