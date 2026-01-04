import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

export interface ConfirmDialogData {
  title: string;
  message: string;
  cancelLabel?: string;
  confirmLabel?: string;
  isDangerous?: boolean;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css',
})
export class ConfirmDialog {
  @Input() data!: ConfirmDialogData;

  constructor(public activeModal: NgbActiveModal) { }

  onCancel(): void {
    this.activeModal.close(false);
  }

  onConfirm(): void {
    this.activeModal.close(true);
  }
}
