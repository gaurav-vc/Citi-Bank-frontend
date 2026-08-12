import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dashboardAPI } from "@/api/dashboard";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Video, FileText, Lightbulb, PlayCircle, BookOpen } from "lucide-react";

export default function DocumentationConfigPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("quick_start");
  const [url, setUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Queries
  const { data: rawDocs, isLoading } = useQuery({
    queryKey: ['documentation'],
    queryFn: async () => {
      const res = await dashboardAPI.getDocumentation();
      return Array.isArray(res) ? res : (res.data?.results || (res as any).results || (res as any).data || []);
    }
  });

  const docs = Array.isArray(rawDocs) ? rawDocs : [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (formData: FormData) => dashboardAPI.createDocumentation(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      toast({ title: "Success", description: "Documentation item created successfully." });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to create item", variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, formData }: { id: string | number, formData: FormData }) => dashboardAPI.updateDocumentation(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      toast({ title: "Success", description: "Documentation item updated successfully." });
      setIsDialogOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to update item", variant: "destructive" });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => dashboardAPI.deleteDocumentation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentation'] });
      toast({ title: "Success", description: "Documentation item deleted." });
    }
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory("quick_start");
    setUrl("");
    setThumbnailUrl("");
    setVideoFile(null);
    setOrder(0);
    setIsActive(true);
    setEditingItem(null);
  };

  const handleOpenNew = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    setTitle(item.title);
    setDescription(item.description || "");
    setCategory(item.category);
    setUrl(item.url || "");
    setThumbnailUrl(item.thumbnail_url || "");
    setOrder(item.order || 0);
    setIsActive(item.is_active);
    setEditingItem(item);
    setVideoFile(null);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('url', url);
    formData.append('thumbnail_url', thumbnailUrl);
    formData.append('order', order.toString());
    formData.append('is_active', isActive.toString());
    if (videoFile) {
      formData.append('video_file', videoFile);
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat === 'quick_start') return <Lightbulb className="w-4 h-4 text-amber-500" />;
    if (cat === 'video_tutorial') return <PlayCircle className="w-4 h-4 text-rose-500" />;
    return <BookOpen className="w-4 h-4 text-blue-500" />;
  };

  const getCategoryLabel = (cat: string) => {
    if (cat === 'quick_start') return "Quick Start";
    if (cat === 'video_tutorial') return "Video Tutorial";
    return "Module Guide";
  };

  return (
    <MainLayout>
      <div className="p-6 max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">System Documentation</h1>
            <p className="text-slate-500 mt-2">Manage the documentation links and videos that appear in the Documentation Center side-panel.</p>
          </div>
          <Button onClick={handleOpenNew} className="bg-slate-900 hover:bg-slate-800 text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Item
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Documentation Items</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
            ) : docs.length === 0 ? (
              <div className="text-center py-12 text-slate-500 border border-dashed rounded-lg bg-slate-50 dark:bg-slate-900/50">
                <FileText className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                <p>No documentation items found.</p>
                <Button onClick={handleOpenNew} variant="link" className="text-blue-600 mt-2">Create your first item</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800/50 border-y">
                    <tr>
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Category</th>
                      <th className="px-4 py-3 font-medium">Order</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <td className="px-4 py-4">
                          <div className="font-medium text-slate-900 dark:text-slate-100">{item.title}</div>
                          {item.description && <div className="text-xs text-slate-500 mt-1 truncate max-w-xs">{item.description}</div>}
                          {(item.video_file || item.url) && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-blue-600">
                              {item.video_file ? <Video className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                              <span className="truncate max-w-[200px]">{item.video_file ? 'Local Video' : item.url}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <Badge variant="outline" className="flex w-fit items-center gap-1.5 font-medium bg-slate-50">
                            {getCategoryIcon(item.category)}
                            {getCategoryLabel(item.category)}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-slate-500">{item.order}</td>
                        <td className="px-4 py-4">
                          {item.is_active ? (
                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 font-medium border-0">Active</Badge>
                          ) : (
                            <Badge variant="secondary" className="font-medium">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                              <Edit className="w-4 h-4 text-slate-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => {
                              if(window.confirm('Are you sure you want to delete this item?')) {
                                deleteMutation.mutate(item.id);
                              }
                            }}>
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Edit Documentation' : 'Add Documentation'}</DialogTitle>
              <DialogDescription>
                Configure how this item appears in the Documentation side-panel.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Title <span className="text-rose-500">*</span></Label>
                  <Input required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. How to raise a Requisition" />
                </div>
                
                <div className="col-span-2 space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief summary displayed under the title" />
                </div>

                <div className="col-span-1 space-y-2">
                  <Label>Category</Label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="quick_start">Quick Start</option>
                    <option value="video_tutorial">Video Tutorial</option>
                    <option value="module_guide">Module Guide</option>
                  </select>
                </div>

                <div className="col-span-1 space-y-2">
                  <Label>Display Order</Label>
                  <Input type="number" value={order} onChange={e => setOrder(parseInt(e.target.value) || 0)} />
                </div>

                <div className="col-span-2 space-y-2 border-t pt-4">
                  <Label>External URL (Optional)</Label>
                  <Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://docs.campusspend.com/guide" />
                  <p className="text-xs text-slate-500">Link to an external guide or YouTube video.</p>
                </div>

                <div className="col-span-2 space-y-2">
                  <Label>Local Video File (Optional)</Label>
                  <Input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
                  <p className="text-xs text-slate-500">Overrides External URL if provided. Upload an MP4 or similar format.</p>
                  {editingItem?.video_file && !videoFile && (
                    <p className="text-xs text-green-600 font-medium mt-1">Current: {editingItem.video_file.split('/').pop()}</p>
                  )}
                </div>
                
                {category === 'video_tutorial' && (
                  <div className="col-span-2 space-y-2">
                    <Label>Thumbnail URL (For Video Category)</Label>
                    <Input value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://example.com/thumbnail.jpg" />
                  </div>
                )}

                <div className="col-span-2 flex items-center justify-between border-t pt-4">
                  <div>
                    <Label className="text-base font-semibold">Active Status</Label>
                    <p className="text-sm text-slate-500">Inactive items won't appear in the documentation panel.</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save Item'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
