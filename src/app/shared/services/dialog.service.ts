import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Observable, from, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ConfirmDialog, ConfirmDialogData } from '../confirm-dialog/confirm-dialog';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private readonly modalService: NgbModal) { }

  confirm(data: ConfirmDialogData): Observable<boolean> {
    const modalRef = this.modalService.open(ConfirmDialog, {
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    // Pass data to the component instance
    modalRef.componentInstance.data = data;

    // Convert result promise to observable
    // When dismissed (Backdrop click), it throws, so we catch and return false
    return from(modalRef.result).pipe(
      map(result => result === true),
      catchError(() => of(false))
    );
  }
}
