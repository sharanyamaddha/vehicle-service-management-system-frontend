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
      centered: true,
      animation: false
    });

    modalRef.componentInstance.data = data;

    return from(modalRef.result).pipe(
      map(result => result === true),
      catchError(() => of(false))
    );
  }
}
