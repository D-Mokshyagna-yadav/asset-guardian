import { useState, useEffect } from 'react';
import {
  categoriesApi,
  configurationApi,
  type CategoryItem,
  type RoleColorConfig,
  type StatusStyleConfig,
} from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tags,
  Plus,
  Trash2,
  Edit,
  Palette,
  Shield,
  Settings2,
  Loader2,
} from 'lucide-react';
import { useConfirm } from '@/components/ConfirmDialog';
import { toast } from 'sonner';

// ─── Categories Section ───
function CategoriesSection() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();

  const fetchCategories = async () => {
    try {
      const res = await categoriesApi.getCategories();
      setCategories(res.data.data?.categories || []);
    } catch {
      console.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setDialogOpen(true);
  };

  const openEdit = (cat: CategoryItem) => {
    setEditingId(cat._id);
    setName(cat.name);
    setDescription(cat.description || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Category name is required'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await categoriesApi.updateCategory(editingId, { name: name.trim(), description: description.trim() || undefined });
        toast.success('Category updated');
      } else {
        await categoriesApi.createCategory({ name: name.trim(), description: description.trim() || undefined });
        toast.success('Category created');
      }
      setDialogOpen(false);
      setLoading(true);
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: CategoryItem) => {
    const ok = await confirm({
      title: 'Delete Category',
      description: `Delete category "${cat.name}"? Devices using this category will keep their current value.`,
      confirmText: 'Delete',
      variant: 'destructive',
    });
    if (!ok) return;
    try {
      await categoriesApi.deleteCategory(cat._id);
      toast.success('Category deleted');
      setCategories((prev) => prev.filter((c) => c._id !== cat._id));
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to delete category');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Tags className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Device Categories</CardTitle>
              <CardDescription>Manage the categories available for devices</CardDescription>
            </div>
          </div>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No categories configured yet.</p>
        ) : (
          <div className="space-y-2">
            {categories.map((cat) => (
              <div key={cat._id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 hover:bg-muted/60 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{cat.name}</p>
                  {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => handleDelete(cat)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Category' : 'New Category'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update the category details.' : 'Add a new device category.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Laptop" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// ─── Status Styles Section ───
function StatusStylesSection() {
  const [styles, setStyles] = useState<StatusStyleConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await configurationApi.getStatusStyles();
        setStyles(res.data.data || []);
      } catch {
        console.error('Failed to load status styles');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-100">
            <Palette className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Status Styles</CardTitle>
            <CardDescription>Badge styles applied to device &amp; assignment statuses</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : styles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No status styles configured.</p>
        ) : (
          <div className="grid gap-2">
            {styles.map((s) => (
              <div key={s.status} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${s.classes}`}
                  >
                    {s.status.replace(/_/g, ' ')}
                  </span>
                  {s.label && <span className="text-xs text-muted-foreground">{s.label}</span>}
                </div>
                <code className="text-xs text-muted-foreground font-mono max-w-[200px] truncate">{s.classes}</code>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Role Colors Section ───
function RoleColorsSection() {
  const [roles, setRoles] = useState<RoleColorConfig[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await configurationApi.getRoleColors();
        setRoles(res.data.data || []);
      } catch {
        console.error('Failed to load role colors');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-100">
            <Shield className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Role Colors</CardTitle>
            <CardDescription>Badge colors for user roles</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : roles.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No role colors configured.</p>
        ) : (
          <div className="grid gap-2">
            {roles.map((r) => (
              <div key={r.role} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${r.badgeColor}`}
                  >
                    {r.displayLabel}
                  </span>
                  <span className="text-sm text-foreground">{r.role}</span>
                </div>
                <code className="text-xs text-muted-foreground font-mono max-w-[200px] truncate">{r.badgeColor}</code>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Settings Page ───
export default function SettingsPage() {
  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 animate-slide-up">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-100">
            <Settings2 className="h-6 w-6 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Settings</h1>
            <p className="text-muted-foreground mt-0.5">Manage categories, status styles, and system configuration</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CategoriesSection />
        <StatusStylesSection />
        <RoleColorsSection />
      </div>
    </div>
  );
}
