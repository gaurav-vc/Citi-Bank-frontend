import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DrilldownData } from '@/types';
import { cn } from '@/lib/utils';

interface DrilldownChartProps {
  title: string;
  data: DrilldownData[];
  className?: string;
}

const COLORS = ['hsl(173, 58%, 39%)', 'hsl(222, 47%, 30%)', 'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(199, 89%, 48%)'];

export function DrilldownChart({ title, data, className }: DrilldownChartProps) {
  const [drillPath, setDrillPath] = useState<DrilldownData[]>([]);
  const [currentData, setCurrentData] = useState<DrilldownData[]>(data);

  const handleDrillDown = (item: DrilldownData) => {
    if (item.children && item.children.length > 0) {
      setDrillPath([...drillPath, { ...item, children: currentData }]);
      setCurrentData(item.children);
    }
  };

  const handleDrillUp = () => {
    if (drillPath.length > 0) {
      const newPath = [...drillPath];
      const parent = newPath.pop();
      setDrillPath(newPath);
      setCurrentData(parent?.children || data);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as DrilldownData;
      return (
        <div className="bg-popover border rounded-lg shadow-lg p-3">
          <p className="font-medium">{item.label}</p>
          <p className="text-lg font-bold text-primary">{formatCurrency(item.value)}</p>
          {item.children && item.children.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Click to drill down</p>
          )}
        </div>
      );
    }
    return null;
  };

  const breadcrumbs = drillPath.map((item, index) => item.label);

  return (
    <Card className={cn('', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          {drillPath.length > 0 && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDrillUp}
                className="h-7 px-2"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <span className="flex items-center gap-1">
                {breadcrumbs.map((crumb, i) => (
                  <span key={i} className="flex items-center">
                    {i > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                    <span className={i === breadcrumbs.length - 1 ? 'text-foreground font-medium' : ''}>
                      {crumb}
                    </span>
                  </span>
                ))}
              </span>
            </div>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          Level {drillPath.length + 1} of 3
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={currentData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value)}
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              onClick={(data) => handleDrillDown(data)}
              style={{ cursor: 'pointer' }}
            >
              {currentData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        
        {/* Data Table */}
        <div className="mt-4 border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">Name</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">Amount</th>
                <th className="text-right px-4 py-2 font-medium text-muted-foreground">% Share</th>
                <th className="text-center px-4 py-2 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {currentData.map((item, index) => {
                const total = currentData.reduce((sum, d) => sum + d.value, 0);
                const percentage = ((item.value / total) * 100).toFixed(1);
                
                return (
                  <tr key={item.id} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{item.label}</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.value)}</td>
                    <td className="px-4 py-3 text-right">{percentage}%</td>
                    <td className="px-4 py-3 text-center">
                      {item.children && item.children.length > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDrillDown(item)}
                          className="h-7"
                        >
                          Drill Down
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
