import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserResponse, UserService } from '../../../core/services/user-service';
import { DialogService } from '../../../shared/services/dialog.service';

@Component({
  selector: 'app-admin-invites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-invites.html',
  styleUrl: './admin-invites.css',
})
export class AdminInvites implements OnInit {
  invitedUsers: UserResponse[] = [];
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private userService: UserService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService
  ) { }

  ngOnInit(): void {
    this.loadInvitedUsers();
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
}
