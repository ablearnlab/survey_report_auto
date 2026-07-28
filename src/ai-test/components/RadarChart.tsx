import React, { useEffect, useRef } from 'react';
import { Chart, RadialLinearScale, PointElement, LineElement, Filler, Tooltip, RadarController } from 'chart.js';
import { AreaResult } from '../types';

export const RadarChartPrintPlugin: any = {
  id: 'custom_canvas_background_color',
  beforeDraw: (chart: any) => {
    const ctx = chart.canvas.getContext('2d');
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

Chart.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, RadarController, RadarChartPrintPlugin);

const RadarChart: React.FC<{ data: AreaResult[] }> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartRef.current = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: data.map(d => {
          const names: any = { Understanding: "기초이해", Prompting: "프롬프팅", Evaluation: "결과검증", Practical: "실무활용", Ethics: "윤리보안", Automation: "업무자동화" };
          return names[d.area];
        }),
        datasets: [{
          label: '영역별 달성도 (%)',
          data: data.map(d => d.percentage),
          backgroundColor: 'rgba(79, 70, 229, 0.2)',
          borderColor: 'rgb(79, 70, 229)',
          borderWidth: 3,
          pointBackgroundColor: 'rgb(79, 70, 229)',
          pointRadius: 4,
          pointHoverRadius: 6,
        }]
      },
      options: {
        devicePixelRatio: 4,
        animation: false, // Ensure chart renders instantly for PDF export
        scales: {
          r: {
            min: 0,
            max: 100,
            beginAtZero: true,
            ticks: { stepSize: 20, display: false },
            grid: { color: '#e2e8f0' },
            pointLabels: { font: { size: 13, weight: 'bold' }, color: '#334155' }
          }
        },
        plugins: { 
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` 달성도: ${ctx.formattedValue}%`
            }
          }
        },
        maintainAspectRatio: false
      }
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  return <div className="h-full w-full"><canvas ref={canvasRef}></canvas></div>;
};

export default RadarChart;
