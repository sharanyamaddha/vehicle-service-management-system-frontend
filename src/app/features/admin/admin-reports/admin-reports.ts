import { Component, OnInit, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InvoiceService, Invoice } from '../../../core/services/invoice';
import { ServiceRequestService, ServiceRequest } from '../../../core/services/service-request';
import { forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-reports.html',
  styleUrl: './admin-reports.css',
})
export class AdminReports implements OnInit, AfterViewInit, OnDestroy {
  isLoading = true;
  allRequests: ServiceRequest[] = [];
  allInvoices: Invoice[] = [];

  @ViewChild('statusChart') statusChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyChart') monthlyChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('partsChart') partsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('revenueChart') revenueChartCanvas!: ElementRef<HTMLCanvasElement>;

  statusChart: Chart | null = null;
  monthlyChart: Chart | null = null;
  partsChart: Chart | null = null;
  revenueChart: Chart | null = null;

  constructor(
    private invoiceService: InvoiceService,
    private serviceRequestService: ServiceRequestService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  loadData(): void {
    this.isLoading = true;
    this.destroyCharts();

    forkJoin({
      requests: this.serviceRequestService.getAllRequests(),
      invoices: this.invoiceService.getAllInvoices()
    }).subscribe({
      next: ({ requests, invoices }) => {
        this.allRequests = requests || [];
        this.allInvoices = invoices || [];
        this.isLoading = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.renderStatusChart();
          this.renderMonthlyChart();
          this.renderPartsChart();
          this.renderRevenueChart();
        }, 100);
      },
      error: (err) => {
        console.error('Failed to load reports', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  destroyCharts(): void {
    if (this.statusChart) this.statusChart.destroy();
    if (this.monthlyChart) this.monthlyChart.destroy();
    if (this.partsChart) this.partsChart.destroy();
    if (this.revenueChart) this.revenueChart.destroy();
  }

  renderStatusChart(): void {
    if (!this.statusChartCanvas) return;

    const counts: { [key: string]: number } = {};
    const statuses = ['REQUESTED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED'];
    statuses.forEach(s => counts[s] = 0);

    this.allRequests.forEach(r => {
      if (counts[r.status] !== undefined) counts[r.status]++;
    });

    const ctx = this.statusChartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.statusChart = new Chart(ctx, {
        type: 'pie',
        data: {
          labels: ['Requested', 'Assigned', 'In Progress', 'Completed', 'Closed'],
          datasets: [{
            data: statuses.map(s => counts[s]),
            backgroundColor: ['#64748b', '#f59e0b', '#3b82f6', '#10b981', '#5b7bb3ff'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'right' } }
        }
      });
    }
  }

  renderMonthlyChart(): void {
    if (!this.monthlyChartCanvas) return;

    const monthCounts = new Array(12).fill(0);
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.allRequests.forEach(r => {
      if (r.createdAt) {
        const d = new Date(r.createdAt);
        if (!isNaN(d.getTime())) {
          monthCounts[d.getMonth()]++;
        }
      }
    });

    const ctx = this.monthlyChartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.monthlyChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Total Requests',
            data: monthCounts,
            backgroundColor: '#6366f1',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  }

  renderPartsChart(): void {
    if (!this.partsChartCanvas) return;

    const partCounts: { [key: string]: number } = {};

    this.allRequests.forEach(req => {
      if (req.usedParts && Array.isArray(req.usedParts)) {
        req.usedParts.forEach(p => {
          const name = p.partName || p.name || 'Unknown Part';
          const qty = p.qty || p.quantity || 1;
          partCounts[name] = (partCounts[name] || 0) + qty;
        });
      }
    });

    const sortedParts = Object.entries(partCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const ctx = this.partsChartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.partsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: sortedParts.map(p => p[0]),
          datasets: [{
            label: 'Units Used',
            data: sortedParts.map(p => p[1]),
            backgroundColor: '#ec4899',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  }

  renderRevenueChart(): void {
    if (!this.revenueChartCanvas) return;

    const monthRevenue = new Array(12).fill(0);
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    this.allInvoices.forEach(inv => {
      if (inv.createdAt) {
        const d = new Date(inv.createdAt);
        if (!isNaN(d.getTime())) {
          monthRevenue[d.getMonth()] += (inv.total || 0);
        }
      }
    });

    const ctx = this.revenueChartCanvas.nativeElement.getContext('2d');
    if (ctx) {
      this.revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: monthLabels,
          datasets: [{
            label: 'Total Revenue (Rs)',
            data: monthRevenue,
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true } }
        }
      });
    }
  }
}
