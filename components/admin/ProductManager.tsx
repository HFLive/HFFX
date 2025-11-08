"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdminProduct } from "./AdminDashboard";
import { AdminButton } from "@/components/admin/AdminButton";
import { cn } from "@/lib/utils";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const initialNewProduct = {
  name: "",
  description: "",
  variants: [{ name: "默认款式", price: "", inventory: 0 }],
};

type Props = {
  products: AdminProduct[];
  loading: boolean;
  reload: () => Promise<void>;
};

export default function ProductManager({ products, loading, reload }: Props) {
  const [newProduct, setNewProduct] = useState(initialNewProduct);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeProducts = useMemo(() => products.filter((p) => p.isActive), [products]);
  const inactiveProducts = useMemo(() => products.filter((p) => !p.isActive), [products]);

  useEffect(() => {
    return () => {
      if (coverImagePreview) {
        URL.revokeObjectURL(coverImagePreview);
      }
    };
  }, [coverImagePreview]);

  const handleAddVariantField = () => {
    setNewProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, { name: "新款式", price: "", inventory: 0 }],
    }));
  };

  const handleRemoveVariantField = (index: number) => {
    setNewProduct((prev) => {
      if (prev.variants.length <= 1) {
        return prev;
      }
      return {
        ...prev,
        variants: prev.variants.filter((_, idx) => idx !== index),
      };
    });
  };

  const handleVariantChange = (index: number, field: "name" | "price" | "inventory", value: string | number) => {
    setNewProduct((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, idx) => {
        if (idx !== index) return variant;
        if (field === "inventory") {
          return { ...variant, inventory: Number(value) };
        }
        return { ...variant, [field]: value };
      }),
    }));
  };

  const updateCoverImage = (file: File | null) => {
    setCoverImageFile(file);
    setCoverImagePreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const handleCoverImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("仅支持上传图片文件");
        event.target.value = "";
        updateCoverImage(null);
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        setError("图片大小不能超过 5MB");
        event.target.value = "";
        updateCoverImage(null);
        return;
      }
    }

    updateCoverImage(file);
    setError((prev) => {
      if (prev === "仅支持上传图片文件" || prev === "图片大小不能超过 5MB") {
        return null;
      }
      return prev;
    });
  };

  const resetCoverImage = () => {
    updateCoverImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCreateProduct = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newProduct.name.trim()) {
      setError("请填写商品名称");
      return;
    }
    if (newProduct.variants.some((variant) => !variant.name.trim())) {
      setError("请填写全部款式名称");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const payloadVariants = newProduct.variants.map((variant) => ({
        name: variant.name.trim(),
        price: variant.price.trim(),
        inventory: Number(variant.inventory) || 0,
      }));

      const formData = new FormData();
      formData.append("name", newProduct.name.trim());
      if (newProduct.description.trim()) {
        formData.append("description", newProduct.description.trim());
      }
      formData.append("variants", JSON.stringify(payloadVariants));
      if (coverImageFile) {
        formData.append("coverImage", coverImageFile);
      }

      const response = await fetch("/api/admin/products", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "创建失败");
      }
      setNewProduct(initialNewProduct);
      resetCoverImage();
      await reload();
    } catch (err: any) {
      setError(err.message ?? "创建失败，请稍后再试");
    } finally {
      setCreating(false);
    }
  };

  const handleInventoryUpdate = async (variantId: string, inventory: number) => {
    try {
      const response = await fetch(`/api/admin/variants/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inventory }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "更新库存失败");
      }
      await reload();
    } catch (err: any) {
      setError(err.message ?? "更新库存失败");
    }
  };

  const handleDeactivateProduct = async (productId: string, productName: string) => {
    const confirmed = window.confirm(`确定要下架 “${productName}” 吗？下架后前台将不再展示该商品。`);
    if (!confirmed) return;
    setDeactivatingId(productId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "下架失败");
      }
      await reload();
    } catch (err: any) {
      setError(err.message ?? "下架失败，请稍后再试");
    } finally {
      setDeactivatingId(null);
    }
  };

  const handleActivateProduct = async (productId: string, productName: string) => {
    setActivatingId(productId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: true }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message ?? "上架失败");
      }
      await reload();
    } catch (err: any) {
      setError(err.message ?? "上架失败，请稍后再试");
    } finally {
      setActivatingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <section className="admin-panel space-y-5">
        <header className="space-y-2">
          <p className="admin-heading">product registry</p>
        </header>
        <h1 className="admin-section-title">新增商品</h1>
        <form className="grid gap-4" onSubmit={handleCreateProduct}>
          <div className="grid gap-2">
            <span className="admin-label">商品名称</span>
            <input
              value={newProduct.name}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, name: event.target.value }))}
              className="admin-input"
              placeholder="请输入商品名称"
              required
            />
          </div>
          <div className="grid gap-2">
            <span className="admin-label">商品描述（可选）</span>
            <textarea
              value={newProduct.description}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, description: event.target.value }))}
              className="admin-input min-h-[96px]"
              placeholder=""
            />
          </div>
          <div className="grid gap-2">
            <span className="admin-label">图片（可选）</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="admin-input file:mr-3 file:border-0 file:bg-emerald-500/20 file:px-3 file:py-1 file:text-xs file:uppercase file:tracking-[0.25em] file:text-emerald-200"
            />
            {coverImagePreview ? (
              <div className="admin-subpanel flex flex-col gap-3 md:flex-row md:items-center">
                <div className="h-20 w-20 overflow-hidden border border-emerald-500/40 bg-black/60">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImagePreview} alt="封面预览" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <p className="admin-text truncate" title={coverImageFile?.name}>
                      {coverImageFile?.name}
                    </p>
                    <p className="admin-text-small">
                      {(() => {
                        const sizeInMb = coverImageFile ? coverImageFile.size / (1024 * 1024) : 0;
                        if (sizeInMb === 0) return "0 MB";
                        if (sizeInMb < 0.01) return "<0.01 MB";
                        return `${sizeInMb.toFixed(2)} MB`;
                      })()}
                    </p>
                  </div>
                  <AdminButton tone="ghost" onClick={resetCoverImage} className="admin-button-danger">
                    移除
                  </AdminButton>
                </div>
              </div>
            ) : (
              <p className="admin-text-small">支持 JPG / PNG / WEBP，大小不超过 5MB。</p>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="admin-label">款式</span>
              <AdminButton tone="plain" type="button" onClick={handleAddVariantField}>
                添加款式
              </AdminButton>
            </div>
            <div className="space-y-3">
              {newProduct.variants.map((variant, index) => (
                <div key={index} className="admin-subpanel space-y-3">
                  <div className="grid gap-2">
                    <span className="admin-label">款式名称</span>
                    <input
                      value={variant.name}
                      onChange={(event) => handleVariantChange(index, "name", event.target.value)}
                      className="admin-input"
                      placeholder="例如：白色 M 码"
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="admin-label">价格（元，可填“待定”）</span>
                      <input
                        value={variant.price}
                        onChange={(event) => handleVariantChange(index, "price", event.target.value)}
                        className="admin-input"
                        placeholder="请填写数字或待定"
                      />
                    </label>
                    <label className="grid gap-2">
                      <span className="admin-label">初始库存</span>
                      <input
                        type="number"
                        min={0}
                        value={variant.inventory}
                        onChange={(event) => handleVariantChange(index, "inventory", Number(event.target.value))}
                        className="admin-input"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {error && <div className="admin-alert">{error}</div>}
          <AdminButton type="submit" disabled={creating} className="w-full md:w-auto">
            {creating ? "创建中..." : "创建商品"}
          </AdminButton>
        </form>
      </section>

      <section className="space-y-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <p className="admin-heading">inventory monitor</p>
            <h2 className="admin-section-title">全部商品</h2>
          </div>
          <p className="admin-muted">
            total {products.length} · online {activeProducts.length} · offline {inactiveProducts.length}
          </p>
        </div>
        {loading ? (
          <div className="admin-panel text-center">
            <p className="admin-text">正在加载商品...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="admin-panel text-center">
            <p className="admin-text">暂无商品，请先新增。</p>
          </div>
        ) : (
          <div className="space-y-8">
            {activeProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="admin-section-title text-base tracking-[0.24em]">已上架</h3>
                  <span className="admin-status-badge">active · {activeProducts.length}</span>
                </div>
                <div className="admin-table">
                  {activeProducts.map((product) => (
                    <div key={product.id} className="admin-panel space-y-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <h4 className="admin-section-title text-base tracking-[0.22em]">{product.name}</h4>
                          {product.description && <p className="admin-text-small">{product.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="admin-status-badge">online</span>
                          <AdminButton
                            tone="danger"
                            onClick={() => handleDeactivateProduct(product.id, product.name)}
                            disabled={deactivatingId === product.id}
                          >
                            {deactivatingId === product.id ? "下架中..." : "下架"}
                          </AdminButton>
                        </div>
                      </div>
                      <div className="admin-table">
                        {product.variants.map((variant) => (
                          <VariantRow
                            key={variant.id}
                            variantId={variant.id}
                            name={variant.name}
                            price={variant.price}
                            inventory={variant.inventory ?? 0}
                            onSave={(value) => handleInventoryUpdate(variant.id, value)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {inactiveProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="admin-section-title text-base tracking-[0.24em]">已下架</h3>
                  <span className="admin-status-badge inactive">offline · {inactiveProducts.length}</span>
                </div>
                <div className="admin-table">
                  {inactiveProducts.map((product) => (
                    <div key={product.id} className="admin-panel space-y-4">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-2">
                          <h4 className="admin-section-title text-base tracking-[0.22em]">{product.name}</h4>
                          {product.description && <p className="admin-text-small">{product.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="admin-status-badge inactive">offline</span>
                          <AdminButton
                            tone="plain"
                            onClick={() => handleActivateProduct(product.id, product.name)}
                            disabled={activatingId === product.id}
                          >
                            {activatingId === product.id ? "上架中..." : "重新上架"}
                          </AdminButton>
                        </div>
                      </div>
                      <div className="admin-kv">
                        <p className="admin-text-small">款式数量：{product.variants.length}</p>
                        <p className="admin-text-small">
                          最近更新：{new Date(product.updatedAt ?? product.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

type VariantRowProps = {
  variantId: string;
  name: string;
  price: number | null;
  inventory: number;
  onSave: (value: number) => void;
};

function VariantRow({ name, price, inventory, onSave }: VariantRowProps) {
  const [inventoryInput, setInventoryInput] = useState(inventory);
  const priceDisplay = price != null ? `¥${(price / 100).toFixed(2)}` : "价格待定";
  const changed = inventoryInput !== inventory;
  return (
    <div className="admin-subpanel grid items-center gap-4 md:grid-cols-[1fr_auto_auto]">
      <div className="space-y-1">
        <p className="admin-text font-semibold">{name}</p>
        <p className="admin-text-small">{priceDisplay}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="admin-text-small">当前库存</span>
        <span className="admin-text">{inventory} 件</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={inventoryInput}
          onChange={(event) => setInventoryInput(Number(event.target.value))}
          className="admin-input w-24"
        />
        <AdminButton tone="plain" onClick={() => onSave(inventoryInput)} disabled={!changed}>
          保存
        </AdminButton>
      </div>
    </div>
  );
}
