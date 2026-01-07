import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { UserService } from '../../../core/services/user-service';
import { ServiceBayService, ServiceBay } from '../../../core/services/service-bay';
import { VehicleService, Vehicle } from '../../../core/services/vehicle';

@Component({
    selector: 'app-manager-request-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './request-detail.html',
    styleUrl: './request-detail.css'
})
// Force re-compilation for TS type update
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
    isEditing = false;
    assignedTech: any = null;
    assignedBay: any = null;

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
            bayNumber: ['', Validators.required]
        });
    }

    // ... (omitting intermediate code if possible, but replace_file_content needs context. I will do separate chunks or one large chunk if close)
    // actually they are far apart. I'll use multi or just replace the specific blocks.
    // I'll do the initForm first. 


    loadData(id: string): void {
        this.isLoading = true;
        console.log('Loading Request Detail for ID:', id);

        forkJoin({
            request: this.requestService.getRequestById(id),
            techs: this.userService.getAvailableTechnicians(),
            users: this.userService.getAllUsers(),
            bays: this.bayService.getAvailableBays(),
            workload: this.requestService.getTechnicianWorkload()
        }).subscribe({
            next: ({ request, techs, users, bays, workload }) => {
                console.log('Request Detail Loaded:', { request, techs, users, bays, workload });
                this.request = request;

                const userMap = new Map<string, any>();
                (users || []).forEach((u: any) => userMap.set(u.id, u));

                // Enrich Technicians with Username and Dynamic Workload
                this.availableTechnicians = (techs || []).map(t => {
                    const currentLoad = workload[t.userId] || 0;

                    let statusLabel = '';
                    let isAvailable = false;

                    if (currentLoad === 0) {
                        statusLabel = 'Available';
                        isAvailable = true;
                    } else if (currentLoad >= 1 && currentLoad <= 2) {
                        statusLabel = 'Busy';
                        isAvailable = true;
                    } else {
                        statusLabel = 'Unavailable';
                        isAvailable = false;
                    }

                    return {
                        ...t,
                        username: userMap.get(t.userId)?.username || 'Unknown Tech',
                        jobCount: currentLoad,
                        availabilityStatus: statusLabel,
                        available: isAvailable
                    };
                });

                // If the current request already has an assigned bay, we might need to fetch it separately in 'bays' if it's not marked 'available' anymore.
                // But for simplicity, we show 'available' bays for NEW assignment.
                this.availableBays = bays || [];

                // Set default specialization based on issue
                if (request.issue) {
                    this.selectedSpecialization = this.guessSpecialization(request.issue);
                }

                if (request.technicianId) {
                    // Try to find in enriched list
                    let found = this.availableTechnicians.find(t => t.userId === request.technicianId);

                    if (!found) {
                        const u = (users as any[]).find(u => u.id === request.technicianId);
                        found = {
                            username: u?.username || 'Unknown',
                            userId: request.technicianId,
                            jobCount: workload[request.technicianId] || 0
                        };
                    }
                    this.assignedTech = found;
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
        const tasks: any = {};

        if (request.vehicleId) {
            tasks.vehicle = this.vehicleService.getVehicleById(request.vehicleId);
        }
        if (request.customerId) {
            tasks.customer = this.userService.getUserById(request.customerId);
        }

        if (Object.keys(tasks).length === 0) {
            this.isLoading = false;
            this.cdr.detectChanges();
            return;
        }

        forkJoin(tasks).subscribe({
            next: (results: any) => {
                if (results.vehicle) {
                    this.vehicle = results.vehicle;
                }
                if (results.customer) {
                    this.customerName = results.customer.username;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error loading dependent details', err);
                this.isLoading = false;
                this.customerName = 'Unknown (Error)';
                this.cdr.detectChanges();
            }
        });
    }

    guessSpecialization(issue: string): string {
        const i = issue.toUpperCase();
        if (i.includes('ENGINE') || i.includes('OIL') || i.includes('EXHAUST')) return 'ENGINE';
        if (i.includes('ELECTRICAL') || i.includes('BATTERY') || i.includes('LIGHT')) return 'ELECTRICAL';
        if (i.includes('DENT') || i.includes('PAINT') || i.includes('BODY')) return 'BODYWORK';
        if (i.includes('BRAKE') || i.includes('PAD') || i.includes('DISC')) return 'BRAKES';
        if (i.includes('AC') || i.includes('COOLING') || i.includes('HEAT')) return 'AC';
        if (i.includes('SERVICE') || i.includes('CHECK') || i.includes('GENERAL')) return 'GENERAL';
        return 'ALL';
    }

    sortOption: string = 'AVAILABILITY';

    onSpecializationChange(event: any): void {
        this.selectedSpecialization = event.target.value;
        this.applyFilters();
    }

    onSortChange(event: any): void {
        this.sortOption = event.target.value;
        this.applyFilters();
    }

    applyFilters(): void {
        let filtered = [...this.availableTechnicians];

        // 1. Specialization Filter
        if (this.selectedSpecialization !== 'ALL') {
            filtered = filtered.filter(t => (t.specialization || 'GENERAL') === this.selectedSpecialization);
        }

        // 2. Sorting Logic
        filtered.sort((a, b) => {

            if (this.sortOption === 'WORKLOAD') {
                return (a.jobCount || 0) - (b.jobCount || 0);
            } else if (this.sortOption === 'AVAILABILITY') {
                return (a.jobCount || 0) - (b.jobCount || 0);
            }
            return 0;
        });

        this.filteredTechnicians = filtered;
    }

    selectBay(bayNumber: any): void {
        this.assignForm.patchValue({ bayNumber: bayNumber });
    }

    // Dialog State
    dialogVisible = false;
    dialogTitle = '';
    dialogMessage = '';
    dialogType: 'info' | 'confirm' | 'error' = 'info';
    private onDialogConfirm: (() => void) | null = null;

    // Labor Cost Modal State
    showLaborCostModal = false;
    laborCostInput: number = 0;

    showInfo(title: string, message: string): void {
        this.dialogTitle = title;
        this.dialogMessage = message;
        this.dialogType = 'info';
        this.dialogVisible = true;
        this.onDialogConfirm = null;
    }

    showError(title: string, message: string): void {
        this.dialogTitle = title;
        this.dialogMessage = message;
        this.dialogType = 'error';
        this.dialogVisible = true;
        this.onDialogConfirm = null;
    }

    showConfirm(title: string, message: string, onConfirm: () => void): void {
        this.dialogTitle = title;
        this.dialogMessage = message;
        this.dialogType = 'confirm';
        this.dialogVisible = true;
        this.onDialogConfirm = onConfirm;
    }

    closeDialog(): void {
        this.dialogVisible = false;
        this.onDialogConfirm = null;
    }

    handleDialogConfirm(): void {
        if (this.onDialogConfirm) {
            this.onDialogConfirm();
        }
        this.closeDialog();
    }

    onSubmit(): void {
        if (this.assignForm.invalid) return;
        this.isSubmitting = true;

        const payload = this.assignForm.value;

        // Optimistic UI Update
        const selectedTechId = payload.technicianId;
        const techIndex = this.availableTechnicians.findIndex(t => t.userId === selectedTechId);

        this.requestService.assignTechnician(this.request.id, payload).subscribe({
            next: () => {
                this.isSubmitting = false;

                // Update local technician state
                if (techIndex !== -1) {
                    this.availableTechnicians[techIndex].jobCount = (this.availableTechnicians[techIndex].jobCount || 0) + 1;
                    this.availableTechnicians = [...this.availableTechnicians]; // Trigger change detection
                    this.applyFilters(); // Re-sort/filter
                }

                this.showInfo('Success', 'Technician Assigned Successfully!');
                this.router.navigate(['/manager/requests']);
            },
            error: (err) => {
                console.error(err);
                this.isSubmitting = false;
                this.showError('Assignment Failed', 'Failed to assign technician: ' + (err.error?.message || err.message));
            }
        });
    }

    closeService(): void {
        this.laborCostInput = 0;
        this.showLaborCostModal = true;
    }

    submitCloseService(): void {
        if (this.laborCostInput < 0) {
            this.showError("Validation Error", "Invalid Labor Cost. Please enter a valid positive number.");
            return;
        }

        const cost = this.laborCostInput;
        this.showLaborCostModal = false;

        this.requestService.closeRequest(this.request.id, cost).subscribe({
            next: () => {
                this.showInfo('Success', 'Service Closed Successfully! Invoice Generated.');
                this.loadData(this.request.id); // Refresh
            },
            error: (err) => {
                this.showError('Error', 'Failed to close service: ' + err.message);
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

    canChangeAssignment(): boolean {
        const s = this.request.status as string;
        return s !== 'COMPLETED' && s !== 'CLOSED';
    }
}
