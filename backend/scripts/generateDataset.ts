import fs from 'fs';
import path from 'path';

interface DatasetRow {
  hour: number;
  dayOfWeek: number;
  isWeekend: number;
  isHoliday: number;
  hasPromotion: number;
  temperatureC: number;
  ordersCount: number;
}

function generateDemandData(days: number = 30): DatasetRow[] {
  const data: DatasetRow[] = [];
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Base demand by hour (typical QSR pattern)
  const hourlyBase = [
    5, 3, 2, 2, 3, 8, 15, 25, 35, 40, 45, 55,  // 0-11
    60, 58, 55, 50, 45, 55, 65, 70, 68, 60, 50, 35  // 12-23
  ];

  // Day of week multipliers (Sunday=0, Saturday=6)
  const dayMultipliers = [0.8, 0.9, 1.0, 1.0, 1.0, 1.2, 1.3];

  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dayOfWeek = currentDate.getDay();
    const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6) ? 1 : 0;
    const isHoliday = (day === 5 || day === 12 || day === 20) ? 1 : 0; // Simulated holidays

    for (let hour = 0; hour < 24; hour++) {
      const hasPromotion = (hour >= 11 && hour <= 14 && dayOfWeek >= 1 && dayOfWeek <= 5) ? 1 : 0; // Lunch promos on weekdays

      // Temperature varies by hour and day
      const baseTemp = 20;
      const hourTempVariation = Math.sin((hour - 6) * Math.PI / 12) * 8; // Peak at 18:00
      const dayTempVariation = Math.sin(day * Math.PI / 15) * 5; // Seasonal variation
      const temperatureC = Math.round((baseTemp + hourTempVariation + dayTempVariation) * 10) / 10;

      // Calculate base orders
      let baseOrders = hourlyBase[hour] * dayMultipliers[dayOfWeek];

      // Apply modifiers
      if (isHoliday) baseOrders *= 0.7; // Lower demand on holidays
      if (hasPromotion) baseOrders *= 1.3; // Higher demand with promotions
      if (temperatureC > 25) baseOrders *= 1.1; // Higher demand in hot weather
      if (temperatureC < 15) baseOrders *= 0.9; // Lower demand in cold weather

      // Add random variation (±15%)
      const randomVariation = 0.85 + Math.random() * 0.3;
      const ordersCount = Math.round(baseOrders * randomVariation);

      data.push({
        hour,
        dayOfWeek,
        isWeekend,
        isHoliday,
        hasPromotion,
        temperatureC,
        ordersCount: Math.max(0, ordersCount),
      });
    }
  }

  return data;
}

function generateCSV(data: DatasetRow[]): string {
  const headers = 'hour,dayOfWeek,isWeekend,isHoliday,hasPromotion,temperatureC,ordersCount';
  const rows = data.map(row =>
    `${row.hour},${row.dayOfWeek},${row.isWeekend},${row.isHoliday},${row.hasPromotion},${row.temperatureC},${row.ordersCount}`
  );
  return [headers, ...rows].join('\n');
}

// Generate 30 days of data (720 rows)
const dataset = generateDemandData(30);
const csvContent = generateCSV(dataset);

const outputPath = path.join(__dirname, '../datasets/demand_dataset.csv');
const outputDir = path.dirname(outputPath);

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, csvContent);
console.log(`Dataset generated: ${outputPath}`);
console.log(`Total rows: ${dataset.length}`);
console.log(`Date range: 30 days`);
console.log(`Features: hour, dayOfWeek, isWeekend, isHoliday, hasPromotion, temperatureC, ordersCount`);
