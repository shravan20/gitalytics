
import { useTheme } from "@/components/ThemeProvider";
import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart2, LineChart as LineChartIcon, PieChart as PieChartIcon } from "lucide-react";

// Define color palettes for different chart types
const COLOR_PALETTES = {
  default: ["#8B5CF6", "#EC4899", "#F97316", "#10B981", "#3B82F6", "#A855F7", "#14B8A6"],
  pastel: ["#C4B5FD", "#FBCFE8", "#FED7AA", "#A7F3D0", "#BFDBFE", "#DDD6FE", "#99F6E4"],
  contrast: ["#6D28D9", "#BE185D", "#EA580C", "#047857", "#1D4ED8", "#7E22CE", "#0F766E"],
  monochrome: ["#1E293B", "#334155", "#475569", "#64748B", "#94A3B8", "#CBD5E1", "#E2E8F0"],
  vibrant: ["#7C3AED", "#DB2777", "#EA580C", "#059669", "#2563EB", "#9333EA", "#0D9488"]
};

interface ChartProps {
  title: string;
  description?: string;
  data: any[];
  type?: "line" | "bar" | "pie" | "multi";
  xKey?: string;
  yKeys?: { key: string; name: string; color?: string }[];
  isLoading?: boolean;
  className?: string;
  colorPalette?: keyof typeof COLOR_PALETTES;
}

export const Chart = ({
  title,
  description,
  data,
  type = "line",
  xKey = "name",
  yKeys = [{ key: "value", name: "Value" }],
  isLoading,
  className,
  colorPalette = "default",
}: ChartProps) => {
  const { theme } = useTheme();
  const [chartType, setChartType] = useState<"line" | "bar" | "pie">(type === "multi" ? "line" : type);
  
  // Assign colors from the palette to yKeys if not already defined
  const colorizedYKeys = useMemo(() => {
    // Select the appropriate color palette based on props or default
    const palette = COLOR_PALETTES[colorPalette] || COLOR_PALETTES.default;
    
    return yKeys.map((item, index) => ({
      ...item,
      color: item.color || palette[index % palette.length],
    }));
  }, [yKeys, colorPalette]);

  // Load placeholder data when isLoading is true
  const chartData = useMemo(() => {
    if (isLoading) {
      return Array.from({ length: 7 }, (_, i) => ({
        name: `Item ${i + 1}`,
        value: 0,
      }));
    }
    return data;
  }, [data, isLoading]);

  const chartColors = useMemo(() => {
    return {
      gridColor: theme === "dark" ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
      tooltipBackground: theme === "dark" ? "#1f2937" : "#ffffff",
      tooltipBorder: theme === "dark" ? "#374151" : "#e5e7eb",
      tooltipText: theme === "dark" ? "#f9fafb" : "#1f2937",
    };
  }, [theme]);

  // Custom tooltip styles
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-2 rounded shadow-md">
          <p className="text-xs font-semibold">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={`item-${index}`} className="text-xs" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (isLoading) {
      return <div className="w-full h-64 skeleton"></div>;
    }

    switch (chartType) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {colorizedYKeys.map((item, index) => (
                <Line
                  key={`line-${index}`}
                  type="monotone"
                  dataKey={item.key}
                  name={item.name}
                  stroke={item.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: item.color, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={chartColors.gridColor} />
              <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {colorizedYKeys.map((item, index) => (
                <Bar 
                  key={`bar-${index}`} 
                  dataKey={item.key} 
                  name={item.name} 
                  fill={item.color}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey={colorizedYKeys[0].key}
                nameKey={xKey}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLOR_PALETTES[colorPalette][index % COLOR_PALETTES[colorPalette].length]} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {type === "multi" && (
          <div className="flex space-x-1">
            <Tabs value={chartType} onValueChange={(value) => setChartType(value as "line" | "bar" | "pie")}>
              <TabsList className="bg-muted/50">
                <TabsTrigger value="line">
                  <LineChartIcon size={16} />
                </TabsTrigger>
                <TabsTrigger value="bar">
                  <BarChart2 size={16} />
                </TabsTrigger>
                <TabsTrigger value="pie">
                  <PieChartIcon size={16} />
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        )}
      </CardHeader>
      <CardContent>{renderChart()}</CardContent>
    </Card>
  );
};

export default Chart;
