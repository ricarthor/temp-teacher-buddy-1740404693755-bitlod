import React from 'react';

interface CustomBoxPlotProps {
  x: number;
  y: number;
  width: number;
  height: number;
  data: {
    min: number;
    q1: number;
    median: number;
    q3: number;
    max: number;
    outliers: number[];
  };
}

export function CustomBoxPlot({ x, y, width, height, data }: CustomBoxPlotProps) {
  const boxWidth = width * 0.8;
  const boxX = x + (width - boxWidth) / 2;

  return (
    <g>
      {/* Box */}
      <rect
        x={boxX}
        y={y + (data.q3 - data.q3) * height}
        width={boxWidth}
        height={(data.q3 - data.q1) * height}
        fill="#2563eb"
        fillOpacity={0.2}
        stroke="#2563eb"
      />
      {/* Median line */}
      <line
        x1={boxX}
        x2={boxX + boxWidth}
        y1={y + (data.median - data.q3) * height}
        y2={y + (data.median - data.q3) * height}
        stroke="#2563eb"
        strokeWidth={2}
      />
      {/* Whiskers */}
      <line
        x1={boxX + boxWidth / 2}
        x2={boxX + boxWidth / 2}
        y1={y + (data.min - data.q3) * height}
        y2={y + (data.q1 - data.q3) * height}
        stroke="#2563eb"
        strokeDasharray="3 3"
      />
      <line
        x1={boxX + boxWidth / 2}
        x2={boxX + boxWidth / 2}
        y1={y + (data.q3 - data.q3) * height}
        y2={y + (data.max - data.q3) * height}
        stroke="#2563eb"
        strokeDasharray="3 3"
      />
      {/* Outliers */}
      {data.outliers?.map((outlier: number, index: number) => (
        <circle
          key={index}
          cx={boxX + boxWidth / 2}
          cy={y + (outlier - data.q3) * height}
          r={3}
          fill="#ef4444"
        />
      ))}
    </g>
  );
}
