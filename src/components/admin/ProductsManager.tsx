"use client";

import { useCallback, useState } from "react";
import { useSyncedListState } from "@/hooks/useSyncedListState";
import { useRouter } from "next/navigation";
import {
  AdminFormCard,
  AdminInlineEditCard,
} from "@/components/admin/AdminForm";
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

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  imageUrl: string;
  category: string;
  sizes: string;
  stock: string;
  active: boolean;
};

const emptyForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  imageUrl: "",
  category: "MERCH",
  sizes: "",
  stock: "0",
  active: true,
};

function formFromProduct(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    imageUrl: product.imageUrl ?? "",
    category: product.category,
    sizes: parseJsonArray(product.sizes).join(", "),
    stock: String(product.stock),
    active: product.active,
  };
}

function productPayload(form: ProductFormState) {
  const sizeList = form.sizes
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    name: form.name,
    description: form.description,
    price: Number(form.price),
    imageUrl: form.imageUrl || undefined,
    category: form.category,
    sizes: sizeList.length > 0 ? JSON.stringify(sizeList) : undefined,
    stock: Number(form.stock),
    active: form.active,
  };
}

function ProductFields({
  form,
  setForm,
  idPrefix,
}: {
  form: ProductFormState;
  setForm: (next: ProductFormState) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Textarea
          id={`${idPrefix}-description`}
          rows={3}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-price`}>Price (£)</Label>
        <Input
          id={`${idPrefix}-price`}
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-stock`}>Stock</Label>
        <Input
          id={`${idPrefix}-stock`}
          type="number"
          min="0"
          value={form.stock}
          onChange={(e) => setForm({ ...form, stock: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <Input
          id={`${idPrefix}-category`}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          placeholder="JERSEY, MERCH, EQUIPMENT"
          required
        />
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-sizes`}>
          Sizes (comma-separated, optional)
        </Label>
        <Input
          id={`${idPrefix}-sizes`}
          value={form.sizes}
          onChange={(e) => setForm({ ...form, sizes: e.target.value })}
          placeholder="S, M, L, XL"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor={`${idPrefix}-image`}>Image URL (optional)</Label>
        <Input
          id={`${idPrefix}-image`}
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
  );
}

export function ProductsManager({
  initialProducts,
}: {
  initialProducts: Product[];
}) {
  const router = useRouter();
  const [products, setProducts] = useSyncedListState(initialProducts);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [listMessage, setListMessage] = useState<string | null>(null);

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
    setEditError(null);
  };

  const loadProducts = useCallback(async () => {
    const result = await apiGet<{ products: Product[] }>("/api/admin/products");
    if (result.ok) setProducts(result.data.products);
  }, [setProducts]);

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm(formFromProduct(product));
    setEditError(null);
    setListMessage(null);
    setCreateMessage(null);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCreateError(null);
    setCreateMessage(null);

    const result = await apiPost(
      "/api/admin/products",
      productPayload(createForm),
    );

    setLoading(false);
    if (!result.ok) {
      setCreateError(result.error);
      return;
    }

    setCreateMessage("Product added.");
    setCreateForm(emptyForm);
    cancelEdit();
    await loadProducts();
    router.refresh();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;

    setLoading(true);
    setEditError(null);
    setListMessage(null);

    const result = await apiPut(
      `/api/admin/products/${editingId}`,
      productPayload(editForm),
    );

    setLoading(false);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }

    setListMessage("Product updated.");
    cancelEdit();
    await loadProducts();
    router.refresh();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    setDeletingId(id);
    const result = await apiDelete(`/api/admin/products/${id}`);
    setDeletingId(null);
    if (!result.ok) {
      setEditError(result.error);
      return;
    }
    if (editingId === id) cancelEdit();
    setListMessage("Product deleted.");
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
        title="Add new product"
        error={createError}
        message={createMessage}
        onSubmit={handleCreate}
        submitLabel="Add product"
        loading={loading && !editingId}
      >
        <ProductFields
          form={createForm}
          setForm={setCreateForm}
          idPrefix="product-create"
        />
      </AdminFormCard>

      <div className="space-y-3">
        <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-zinc-500">
          Current products ({products.length})
        </h3>
        {listMessage ? (
          <p className="text-sm text-emerald-300">{listMessage}</p>
        ) : null}
        {products.map((product) => (
          <AdminInlineEditCard
            key={product.id}
            isEditing={editingId === product.id}
            title={product.name}
            subtitle={`${formatPrice(product.price)} · ${product.category} · Stock: ${product.stock}${product.active ? "" : " · Hidden"}`}
            onEdit={() => startEdit(product)}
            onDelete={() => void handleDelete(product.id)}
            deleting={deletingId === product.id}
            onCancelEdit={cancelEdit}
            onSubmit={(e) => void handleUpdate(e)}
            loading={loading && editingId === product.id}
            error={editingId === product.id ? editError : null}
          >
            <ProductFields
              form={editForm}
              setForm={setEditForm}
              idPrefix={`product-edit-${product.id}`}
            />
          </AdminInlineEditCard>
        ))}
      </div>
    </AdminSection>
  );
}
