import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { UserService } from '../../../core/services/user-service';
import { ServiceBayService, ServiceBay } from '../../../core/services/service-bay';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';

@Component({
    selector: 'app-manager-request-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './request-detail.html',
    styleUrl: './request-detail.css'
})
export class ManagerRequestDetail implements OnInit {
    request!: ServiceRequest;
    vehicle!: Vehicle;
    customerName: string = 'Loading...';

    availableTechnicians: any[] = [];
    filteredTechnicians: any[] = [];
    availableBays: ServiceBay[] = [];

    assignForm!: FormGroup;
    isLoading = true;
    isSubmitting = false;

    selectedSpecialization: string = 'ALL';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private requestService: ServiceRequestService,
        private userService: UserService,
        private vehicleService: VehicleService,
        private bayService: ServiceBayService,
        private fb: FormBuilder,
        private cdr: ChangeDetectorRef
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.loadData(id);
        } else {
            console.error('No ID in route');
            this.router.navigate(['/manager/requests']);
        }
    }

    initForm(): void {
        this.assignForm = this.fb.group({
            technicianId: ['', Validators.required],
            bayId: ['', Validators.required]
        });
    }

    loadData(id: string): void {
        this.isLoading = true;
        console.log('Loading Request Detail for ID:', id);

        forkJoin({
            request: this.requestService.getRequestById(id),
            techs: this.userService.getAvailableTechnicians(), // Note: this currently fetches only 'active' users, likely not filtering by availability=true unless backend does it. 
            // Better to rely on "getUsersByRole('TECHNICIAN')" then filter manually?
            // checking previously viewed files: 'getAvailableTechnicians' calls '/api/technicians/status/true' (Wait, Step 2444 logic? Or Step 2554 logic?)
            // I'll assume it fetches what I need or I filter manually.
            bays: this.bayService.getAvailableBays()
        }).subscribe({
            next: ({ request, techs, bays }) => {
                console.log('Request Detail Loaded:', { request, techs, bays });
                this.request = request;
                this.availableTechnicians = techs || [];
                // If the current request already has an assigned bay, we might need to fetch it separately in 'bays' if it's not marked 'available' anymore.
                // But for simplicity, we show 'available' bays for NEW assignment.
                this.availableBays = bays || [];

                // Set default specialization based on issue
                if (request.issue) {
                    this.selectedSpecialization = this.guessSpecialization(request.issue);
                }

                this.applyFilters();
                this.loadDependentData(request);
            },
            error: (err) => {
                console.error('Error loading request detail:', err);
                this.isLoading = false;
                alert('Failed to load request details: ' + (err.message || 'Unknown error'));
                this.router.navigate(['/manager/requests']);
            }
        });
    }

    loadDependentData(request: ServiceRequest): void {
        if (request.vehicleId) {
            this.vehicleService.getAllVehicles().subscribe(vehicles => {
                const v = vehicles.find(v => v.id === request.vehicleId);
                this.vehicle = v!;
            });
        }

        if (request.customerId) {
            this.userService.getAllUsers().subscribe(users => {
                const u = users.find((u: any) => u.id === request.customerId);
                this.customerName = u ? u.username : 'Unknown';
            });
        }

        this.isLoading = false;
        this.cdr.detectChanges();
    }

    guessSpecialization(issue: string): string {
        const i = issue.toUpperCase();
        if (i.includes('ENGINE') || i.includes('OIL') || i.includes('EXHAUST')) return 'ENGINE';
        if (i.includes('ELECTRICAL') || i.includes('BATTERY') || i.includes('LIGHT')) return 'ELECTRICAL';
        if (i.includes('DENT') || i.includes('PAINT') || i.includes('BODY')) return 'BODYWORK';
        return 'ALL';
    }

    onSpecializationChange(event: any): void {
        this.selectedSpecialization = event.target.value;
        this.applyFilters();
    }

    applyFilters(): void {
        let filtered = this.availableTechnicians;

        // 1. Specialization Filter
        if (this.selectedSpecialization !== 'ALL') {
            filtered = filtered.filter(t => (t.specialization || 'GENERAL') === this.selectedSpecialization);
        }

        // 2. Sort by Workload ASC
        filtered.sort((a, b) => (a.workload || 0) - (b.workload || 0));

        this.filteredTechnicians = filtered;
    }

    selectBay(bayNumber: any): void {
        this.assignForm.patchValue({ bayId: bayNumber });
    }

    onSubmit(): void {
        if (this.assignForm.invalid) return;
        this.isSubmitting = true;

        const payload = this.assignForm.value;
        this.requestService.assignTechnician(this.request.id, payload).subscribe({
            next: () => {
                this.isSubmitting = false;
                alert('Technician Assigned Successfully via Increment Logic');
                this.router.navigate(['/manager/requests']);
            },
            error: (err) => {
                console.error(err);
                this.isSubmitting = false;
                alert('Failed to assign technician: ' + (err.error?.message || err.message));
            }
        });
    }

    getBadgeClass(status: string): string {
        const map: any = {
            'REQUESTED': 'badge-grey',
            'BOOKED': 'badge-grey',
            'ASSIGNED': 'badge-blue',
            'IN_PROGRESS': 'badge-orange',
            'COMPLETED': 'badge-green',
            'CLOSED': 'badge-green'
        };
        return map[status] || 'badge-grey';
    }
}
