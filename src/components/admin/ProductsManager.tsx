"use client";

import { useCallback, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import { AdminFormCard, AdminListItem, beginAdminEdit } from "@/components/admin/AdminForm";
import { AdminSection } from "@/components/admin/AdminShell";
import { Checkbox, Input, Label } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/InputFields";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/client-api";
import { formatPrice, parseJsonArray } from "@/lib/utils";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string | null;
  category: string;
  sizes: string | null;
  stock: number;
  active: boolean;
};

const emptyForm = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "MERCH",
  sizes: "",
  stock: "0",
  active: true,
};

export function ProductsManager({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [products, setProducts] = useSyncedListState(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError(null);
  };

  const loadProducts = useCallback(async () => {
    const result = await apiGet<{ products: Product[] }>("/api/admin/products");
    if (result.ok) setProducts(result.data.products);
  }, [setProducts]);

  const startEdit = (product: Product) => {
    beginAdminEdit(() => {
      setEditingId(product.id);
      setForm({
        name: product.name,
        description: product.description,
        price: String(product.price),
        imageUrl: product.imageUrl ?? "",
        category: product.category,
        sizes: parseJsonArray(product.sizes).join(", "),
        stock: String(product.stock),
        active: product.active,
      });
      setError(null);
      setMessage(null);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const sizeList = form.sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: form.name,
      description: form.description,
      price: Number(form.price),
      imageUrl: form.imageUrl || undefined,
      category: form.category,
      sizes: sizeList.length > 0 ? JSON.stringify(sizeList) : undefined,
      stock: Number(form.stock),
      active: form.active,
    };

    const result = editingId
      ? await apiPut(`/api/admin/products/${editingId}`, payload)
      : await apiPost("/api/admin/products", payload);

    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setMessage(editingId ? "Product updated." : "Product added.");
    resetForm();
    await loadProducts();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/products/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (editingId === id) resetForm();
    await loadProducts();
    router.refresh();
  };

  return (
    <AdminSection
      title="Shop products"
      description="Manage items in the club shop."
    >
      <AdminFormCard
        collapsible
        openTriggerLabel="Add new product"
        title={editingId ? "Edit product" : "Add new product"}
        error={error}
        message={message}
        onSubmit={handleSubmit}
        onCancel={editingId ? resetForm : undefined}
        submitLabel={editingId ? "Save changes" : "Add product"}
        loading={loading}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="product-name">Name</Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="product-description">Description</Label>
            <Textarea
              id="product-description"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="product-price">Price (£)</Label>
            <Input
              id="product-price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="product-stock">Stock</Label>
            <Input
              id="product-stock"
              type="number"
              min="0"
              value={form.stock}
              onChange={(e) => setForm({ ...form, stock: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="product-category">Category</Label>
            <Input
              id="product-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="JERSEY, MERCH, EQUIPMENT"
              required
            />
          </div>
          <div>
            <Label htmlFor="product-sizes">Sizes (comma-separated, optional)</Label>
            <Input
              id="product-sizes"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              placeholder="S, M, L, XL"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="product-image">Image URL (optional)</Label>
            <Input
              id="product-image"
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="/products/jersey-home.jpg"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-zinc-300">
            <Checkbox
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Visible in shop
          </label>
        </div>
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current products ({products.length})
        </h3>
        {products.map((product) => (
          <AdminListItem
            key={product.id}
            title={product.name}
            subtitle={`${formatPrice(product.price)} · ${product.category} · Stock: ${product.stock}${product.active ? "" : " · Hidden"}`}
            onEdit={() => startEdit(product)}
            onDelete={() => handleDelete(product.id)}
            deleting={deletingId === product.id}
          />
        ))}
      </div>
    </AdminSection>
  );
}
