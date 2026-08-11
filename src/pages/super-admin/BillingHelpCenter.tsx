import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { 
  ArrowLeft, 
  Search, 
  Grid, 
  Calendar, 
  Receipt, 
  CreditCard, 
  ShieldCheck, 
  HelpCircle,
  Mail,
  Phone,
  ChevronDown,
  ChevronUp,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const FAQS = [
  {
    id: 1,
    question: "How do I change my billing cycle?",
    answer: "You can change your billing cycle from Monthly to Annual (or vice-versa) by navigating to the Subscription section in your Organization settings. Changes take effect at the start of your next billing period, and any prorated amounts will be automatically calculated."
  },
  {
    id: 2,
    question: "When are invoices generated?",
    answer: "Invoices are generated on the 1st of every month for active subscriptions. If you are on an annual plan, your invoice is generated on the anniversary date of your subscription activation."
  },
  {
    id: 3,
    question: "Accepted payment methods?",
    answer: "We currently accept all major credit cards (Visa, MasterCard, American Express), direct bank transfers (ACH/NEFT), and verified corporate purchase orders for enterprise clients."
  },
  {
    id: 4,
    question: "How do I update my Tax ID / GST Identification Number?",
    answer: "Go to your Organization Settings > Billing Profile. From there, you can enter or update your GSTIN or Tax ID. Once saved, this ID will automatically appear on all future invoices."
  },
  {
    id: 5,
    question: "What happens if a subscription payment fails?",
    answer: "If a payment fails, we will notify the billing admin via email and retry the charge after 3 and 7 days. Your services will remain active during this 7-day grace period. After that, your account may be temporarily suspended until payment is successfully processed."
  },
  {
    id: 6,
    question: "Can I get customized invoices or PO numbers attached?",
    answer: "Yes, enterprise customers can add custom PO numbers to their invoices. Please submit a request via the support ticket form with your PO details and we will attach it to your next billing cycle."
  }
];

const TABS = [
  { id: 'all', label: 'All Topics', icon: Grid },
  { id: 'cycle', label: 'Billing Cycle', icon: Calendar },
  { id: 'invoices', label: 'Invoices & Receipts', icon: Receipt },
  { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  { id: 'tax', label: 'Tax & Compliance', icon: ShieldCheck },
];

export default function BillingHelpCenter() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Ticket Form State
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const handleFaqToggle = (id: number) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast({ title: "Incomplete Form", description: "Please provide a subject and issue description.", variant: "destructive" });
      return;
    }
    toast({ 
      title: "Ticket Submitted Successfully", 
      description: "Our billing support team will get back to you within 24 hours.",
      className: "bg-green-50 text-green-700 border-green-200"
    });
    setSubject("");
    setDescription("");
  };

  return (
    <MainLayout>
      <div className="p-6 bg-slate-50 min-h-screen">
        
        {/* Header Navigation */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
            <span>Super Admin Portal</span>
            <span className="text-slate-300">•</span>
            <span>Billing Help Center</span>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate('/super-admin/billing')}
              className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Billing & Subscription Help Center
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-2 ml-11">
            Find answers to common billing questions or reach out to our dedicated support team.
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-[#0b132b] rounded-2xl p-10 md:p-14 mb-8 shadow-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-blue-800 bg-blue-900/40 px-3 py-1 text-xs font-semibold text-blue-300 mb-6 backdrop-blur-sm">
              CampusSpend Billing Support
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
              How can we help with your billing today?
            </h2>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search billing cycle, invoices, GST, payment methods..." 
                className="w-full h-14 pl-12 pr-4 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 text-slate-900 shadow-md text-[15px]"
              />
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
                  isActive 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-blue-200' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: FAQs */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                  <HelpCircle className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h3>
              </div>
              <p className="text-sm text-slate-500 mb-6 pl-11">
                Click any question to view detailed step-by-step instructions.
              </p>

              <div className="space-y-3">
                {FAQS.map((faq) => (
                  <div 
                    key={faq.id} 
                    className="border border-slate-200 rounded-xl overflow-hidden transition-all duration-200"
                  >
                    <button
                      onClick={() => handleFaqToggle(faq.id)}
                      className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 text-left transition-colors"
                    >
                      <span className="font-semibold text-[14px] text-slate-800">{faq.question}</span>
                      <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-colors ${openFaq === faq.id ? 'bg-slate-100 text-slate-600' : 'bg-transparent text-slate-400'}`}>
                        {openFaq === faq.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </button>
                    {openFaq === faq.id && (
                      <div className="p-4 pt-1 bg-slate-50 border-t border-slate-100 text-sm text-slate-600 leading-relaxed">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Contact & Support */}
          <div className="space-y-6">
            
            {/* Contact Support Form */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-indigo-600 rounded-full flex items-center justify-center border-dashed">
                    <div className="h-1.5 w-1.5 bg-indigo-600 rounded-full"></div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900">Contact Billing Support</h3>
              </div>
              <p className="text-[13px] text-slate-500 mb-6">
                Need specialized assistance with your organization billing? Submit a ticket directly.
              </p>

              <form onSubmit={handleTicketSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Subject</Label>
                  <Input 
                    placeholder="e.g. Invoice discrepancy or GST update" 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-slate-50 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-600">Issue Description</Label>
                  <textarea 
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your billing query or issue..."
                    className="w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold h-10">
                  <Send className="h-4 w-4 mr-2" /> Submit Ticket
                </Button>
              </form>
            </div>

            {/* Direct Contact Info */}
            <div className="bg-[#0b132b] rounded-2xl p-5 shadow-lg text-white space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-900/50 border border-blue-800 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px]">Direct Support Email</h4>
                  <a href="mailto:billing@campusspend.com" className="text-[13px] text-blue-300 hover:text-white transition-colors">
                    billing@campusspend.com
                  </a>
                </div>
              </div>
              
              <div className="h-px bg-slate-800/50 w-full" />
              
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-900/30 border border-emerald-800/50 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-bold text-[14px]">Enterprise Support Desk</h4>
                  <p className="text-[13px] text-emerald-200/80">
                    +1 (800) 555-SPND
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">(Mon-Fri, 9am-6pm EST)</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </MainLayout>
  );
}
