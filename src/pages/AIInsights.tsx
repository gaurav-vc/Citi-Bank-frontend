import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Package,
  DollarSign,
  Users,
  Lightbulb,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InsightCard {
  id: string;
  type: 'risk' | 'opportunity' | 'alert' | 'prediction';
  title: string;
  description: string;
  metric?: string;
  trend?: 'up' | 'down';
  confidence: number;
  action?: string;
}

interface VendorTrend {
  vendor: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  change: string;
}

interface CostPrediction {
  category: string;
  current: number;
  predicted: number;
  variance: number;
}

export default function AIInsights() {
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [vendorTrends, setVendorTrends] = useState<VendorTrend[]>([]);
  const [costPreds, setCostPreds] = useState<CostPrediction[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const token = localStorage.getItem('campusspend_token');
        const base = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.MODE === 'production' ? 'https://procurement.vibesandbox.live' : 'http://localhost:8000'));
        const res = await fetch(`${base}/api/reports/ai-insights/`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setInsights(data.insights || []);
          setMessage(data.message || '');
          setVendorTrends(data.vendorPerformanceTrends || []);
          setCostPreds(data.costPredictions || []);
        }
      } catch (err) {
        console.error('Failed to load AI Insights:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInsights();
  }, []);

  const getTypeIcon = (type: InsightCard['type']) => {
    switch (type) {
      case 'risk':
        return <AlertTriangle className="h-5 w-5 text-destructive" />;
      case 'alert':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'opportunity':
        return <Lightbulb className="h-5 w-5 text-success" />;
      case 'prediction':
        return <TrendingUp className="h-5 w-5 text-info" />;
    }
  };

  const getTypeBadge = (type: InsightCard['type']) => {
    switch (type) {
      case 'risk':
        return <Badge variant="destructive">Risk</Badge>;
      case 'alert':
        return <Badge className="bg-warning/10 text-warning border-warning">Alert</Badge>;
      case 'opportunity':
        return <Badge className="bg-success/10 text-success border-success">Opportunity</Badge>;
      case 'prediction':
        return <Badge className="bg-info/10 text-info border-info">Prediction</Badge>;
    }
  };

  // Calculate counts based on loaded data
  const activeRisks = insights.filter(i => i.type === 'risk').length;
  const alertsCount = insights.filter(i => i.type === 'alert').length;
  const savingsOpportunity = insights.find(i => i.type === 'opportunity')?.metric || '₹0';
  const predictionsCount = insights.filter(i => i.type === 'prediction').length;

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">AI Insights</h1>
              <p className="text-muted-foreground">
                Intelligent analytics and predictive insights for your operations
              </p>
            </div>
          </div>
          <Badge variant="outline" className="flex items-center gap-2 px-4 py-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Dynamic Engine Active</span>
          </Badge>
        </div>

        {isLoading ? (
          <div className="min-h-[400px] flex items-center justify-center">
            <span className="text-muted-foreground text-sm">Loading AI insights...</span>
          </div>
        ) : message ? (
          <div className="space-y-6">
            {/* Empty Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Risks</p>
                      <p className="text-2xl font-bold text-destructive">0</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-destructive/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Alerts</p>
                      <p className="text-2xl font-bold text-warning">0</p>
                    </div>
                    <Clock className="h-8 w-8 text-warning/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-success/30 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Opportunities</p>
                      <p className="text-2xl font-bold text-success">₹0</p>
                    </div>
                    <Lightbulb className="h-8 w-8 text-success/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-info/30 bg-info/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Predictions</p>
                      <p className="text-2xl font-bold text-info">0</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-info/30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Insufficient Data Callout */}
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                <Brain className="h-12 w-12 text-primary/40 mb-4 animate-pulse" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Insufficient Transactional Data</h3>
                <p className="text-muted-foreground max-w-md">
                  {message} (Requires at least 3 purchase orders, items, and vendors to compile intelligent predictions).
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Risks</p>
                      <p className="text-2xl font-bold text-destructive">{activeRisks}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-destructive/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-warning/30 bg-warning/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Alerts</p>
                      <p className="text-2xl font-bold text-warning">{alertsCount}</p>
                    </div>
                    <Clock className="h-8 w-8 text-warning/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-success/30 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Opportunities</p>
                      <p className="text-2xl font-bold text-success">{savingsOpportunity}</p>
                    </div>
                    <Lightbulb className="h-8 w-8 text-success/30" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-info/30 bg-info/5">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Predictions</p>
                      <p className="text-2xl font-bold text-info">{predictionsCount}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-info/30" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* AI Insights Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Insights Cards */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-accent" />
                    AI-Powered Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {insights.map((insight) => (
                      <div
                        key={insight.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-all hover:border-primary/30"
                      >
                        <div className="flex items-start justify-between mb-3">
                          {getTypeIcon(insight.type)}
                          {getTypeBadge(insight.type)}
                        </div>
                        <h4 className="font-semibold mb-2">{insight.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          {insight.description}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          {insight.metric && (
                            <span className="text-lg font-bold">{insight.metric}</span>
                          )}
                          <div className="flex items-center gap-1 text-sm">
                            <span className="text-muted-foreground">Confidence:</span>
                            <span className="font-medium">{insight.confidence}%</span>
                          </div>
                        </div>
                        <Progress value={insight.confidence} className="h-1 mb-3" />
                        {insight.action && (
                          <Button variant="ghost" size="sm" className="w-full justify-between">
                            {insight.action}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Vendor Performance Trends */}
              {vendorTrends.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-accent" />
                      Vendor Performance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendorTrends.map((vendor) => (
                      <div key={vendor.vendor} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{vendor.vendor}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={vendor.score} className="h-2 flex-1" />
                            <span className="text-sm font-medium">{vendor.score}%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-4">
                          {vendor.trend === 'up' ? (
                            <TrendingUp className="h-4 w-4 text-success" />
                          ) : vendor.trend === 'down' ? (
                            <TrendingDown className="h-4 w-4 text-destructive" />
                          ) : null}
                          <span className={`text-sm font-medium ${
                            vendor.trend === 'up' ? 'text-success' : 
                            vendor.trend === 'down' ? 'text-destructive' : 
                            'text-muted-foreground'
                          }`}>
                            {vendor.change}
                          </span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Cost Predictions */}
              {costPreds.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-accent" />
                      Next Month Cost Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {costPreds.map((item) => (
                      <div key={item.category} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{item.category}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              Current: ₹{(item.current / 1000).toFixed(0)}K
                            </span>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              ₹{(item.predicted / 1000).toFixed(0)}K
                            </span>
                            {item.variance > 0 && (
                              <Badge variant="secondary" className="text-warning">
                                +{item.variance}%
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Progress value={(item.current / item.predicted) * 100} className="h-2" />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {/* Disclaimer */}
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <p className="text-sm font-medium">AI Insights Disclaimer</p>
                <p className="text-sm text-muted-foreground">
                  These insights are generated using machine learning models based on historical data patterns. 
                  Predictions and recommendations should be validated by domain experts before taking action. 
                  Confidence scores indicate the model's certainty level.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
