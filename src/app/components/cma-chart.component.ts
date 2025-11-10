import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, signal, computed, effect, Signal, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartPoint } from '../models/chart-point.interface';
import { BaseChartDirective, NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartType } from 'chart.js';

@Component({
  selector: 'app-cma-chart',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chart-container">
      <div class="empty-state" *ngIf="!data() || data().length === 0">
        <p>No chart data available</p>
      </div>
      <canvas
        *ngIf="data() && data().length > 0"
        baseChart
        [data]="chartDataConfig()"
        [options]="chartOptions"
        [type]="chartType"
        [legend]="true"
        class="chart">
      </canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      background: white;
      border-radius: 8px;
      padding: 1.5rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      position: relative;
      height: 400px;
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #999;
    }

    .chart {
      max-height: 400px;
    }

    @media (max-width: 768px) {
      .chart-container {
        height: 300px;
      }
    }
  `]
})
export class CmaChartComponent implements AfterViewInit {
  chartDataSignal = signal<ChartPoint[]>([]);
  
  @Input() set data(value: ChartPoint[]) {
    const newData = value || [];
    const currentData = this.chartDataSignal();
    
    // Only update if data actually changed
    if (JSON.stringify(newData) !== JSON.stringify(currentData)) {
      this.chartDataSignal.set(newData);
    }
  }
  
  get data(): Signal<ChartPoint[]> {
    return this.chartDataSignal.asReadonly();
  }
  
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;
  
  ngAfterViewInit(): void {
    // Initial chart render is handled by ng2-charts automatically
  }

  chartType: ChartType = 'bar';

  chartDataConfig = computed<ChartConfiguration['data']>(() => {
    const chartData = this.chartDataSignal();
    
    if (!chartData || chartData.length === 0) {
      return {
        labels: [],
        datasets: [{
          label: 'Sale Price',
          data: [],
          backgroundColor: 'rgba(102, 126, 234, 0.6)',
          borderColor: 'rgba(102, 126, 234, 1)',
          borderWidth: 2
        }]
      };
    }

    return {
      labels: chartData.map(point => String(point.x)),
      datasets: [{
        label: 'Sale Price',
        data: chartData.map(point => point.y),
        backgroundColor: 'rgba(102, 126, 234, 0.6)',
        borderColor: 'rgba(102, 126, 234, 1)',
        borderWidth: 2,
        borderRadius: 5
      }]
    };
  });

  chartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      title: {
        display: true,
        text: 'Similar Properties Sale Prices Over Time',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const chartData = this.chartDataSignal();
            const point = chartData[context.dataIndex];
            const price = typeof context.parsed.y === 'number' 
              ? '$' + context.parsed.y.toLocaleString('en-AU')
              : context.parsed.y;
            return `${point?.label || 'Property'}: ${price}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Sale Price (AUD)'
        },
        ticks: {
          callback: function(value) {
            if (typeof value === 'number' && value >= 1000) {
              return '$' + (value / 1000).toFixed(0) + 'k';
            }
            return '$' + value;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Sale Date'
        }
      }
    }
  };

  constructor(private cdr: ChangeDetectorRef) {
    // Update chart when data changes - but only once per change
    effect(() => {
      const config = this.chartDataConfig();
      const hasData = config.datasets[0].data.length > 0;
      
      if (this.chart && hasData) {
        // Use requestAnimationFrame to batch updates and prevent loops
        requestAnimationFrame(() => {
          if (this.chart) {
            this.chart.update('none'); // 'none' prevents animation that could trigger loops
          }
        });
      }
    });
  }
}

