"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { AdminProduct } from "./AdminDashboard";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-6">
      <section className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">新增商品</h2>
        <form className="grid gap-3" onSubmit={handleCreateProduct}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">商品名称</label>
            <input
              value={newProduct.name}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, name: event.target.value }))}
              className="rounded-xl border border-primary/20 px-3 py-2"
              placeholder=""
              required
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">商品描述（可选）</label>
            <textarea
              value={newProduct.description}
              onChange={(event) => setNewProduct((prev) => ({ ...prev, description: event.target.value }))}
              className="rounded-xl border border-primary/20 px-3 py-2"
              rows={2}
              placeholder=""
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">图片（可选）</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="rounded-xl border border-primary/20 px-3 py-2 file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-sm file:text-primary"
            />
            {coverImagePreview ? (
              <div className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-primary/5 p-3">
                <div className="h-16 w-16 overflow-hidden rounded-xl border border-primary/20 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImagePreview} alt="封面预览" className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 items-center justify-between gap-3">
                  <div className="flex flex-col text-sm text-foreground">
                    <span className="font-medium truncate" title={coverImageFile?.name}>
                      {coverImageFile?.name}
                    </span>
                    <span className="text-xs text-foreground-light">
                      {(() => {
                        const sizeInMb = coverImageFile ? coverImageFile.size / (1024 * 1024) : 0;
                        if (sizeInMb === 0) return "0 MB";
                        if (sizeInMb < 0.01) return "<0.01 MB";
                        return `${sizeInMb.toFixed(2)} MB`;
                      })()}
                    </span>
                  </div>
                  <Button type="button" variant="ghost" onClick={resetCoverImage} className="text-sm text-red-500 hover:text-red-600">
                    移除
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-foreground-light">支持 JPG / PNG / WEBP，大小不超过 5MB。</p>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">款式</label>
              <Button type="button" variant="outline" onClick={handleAddVariantField}>
                添加款式
              </Button>
            </div>
            <div className="space-y-3">
              {newProduct.variants.map((variant, index) => (
                <div key={index} className="grid gap-2 rounded-2xl border border-primary/10 bg-primary/5 p-4">
                  <label className="flex flex-col gap-1 text-sm">
                    <span className="font-medium text-foreground">款式名称</span>
                    <input
                      value={variant.name}
                      onChange={(event) => handleVariantChange(index, "name", event.target.value)}
                      className="rounded-xl border border-primary/20 px-3 py-2"
                      placeholder="例如：白色 M码"
                    />
                  </label>
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-foreground">价格（元，可填“待定”）</span>
                      <input
                        value={variant.price}
                        onChange={(event) => handleVariantChange(index, "price", event.target.value)}
                        className="rounded-xl border border-primary/20 px-3 py-2"
                        placeholder=""
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-sm">
                      <span className="font-medium text-foreground">初始库存</span>
                      <input
                        type="number"
                        min={0}
                        value={variant.inventory}
                        onChange={(event) => handleVariantChange(index, "inventory", Number(event.target.value))}
                        className="rounded-xl border border-primary/20 px-3 py-2"
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" disabled={creating} className="w-full">
            {creating ? "创建中..." : "创建商品"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <h2 className="text-2xl font-semibold text-foreground">全部商品</h2>
          <p className="text-sm text-foreground-light">
            共 {products.length} 件 · 上架 {activeProducts.length} 件 · 下架 {inactiveProducts.length} 件
          </p>
        </div>
        {loading ? (
          <div className="rounded-3xl border border-primary/10 bg-white p-6 text-center text-foreground-light">
            正在加载商品...
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-3xl border border-primary/10 bg-white p-6 text-center text-foreground-light">
            暂无商品，请先新增。
          </div>
        ) : (
          <div className="space-y-6">
            {activeProducts.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">已上架</h3>
                  <span className="text-xs rounded-full bg-primary/10 text-primary px-3 py-1">
                    共 {activeProducts.length} 件
                  </span>
                </div>
                <div className="grid gap-4">
                  {activeProducts.map((product) => (
                    <div key={product.id} className="rounded-3xl border border-primary/10 bg-white p-6 shadow-sm space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-semibold text-foreground">{product.name}</h4>
                          {product.description && <p className="text-sm text-foreground-light mt-1">{product.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs rounded-full bg-primary/10 text-primary px-3 py-1">已上架</span>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleDeactivateProduct(product.id, product.name)}
                            disabled={deactivatingId === product.id}
                            className="border-red-200 text-red-500 hover:border-red-400 hover:bg-red-50"
                          >
                            {deactivatingId === product.id ? "下架中..." : "下架"}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-3">
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
                  <h3 className="text-lg font-semibold text-foreground">已下架</h3>
                  <span className="text-xs rounded-full bg-slate-200 text-slate-600 px-3 py-1">
                    共 {inactiveProducts.length} 件
                  </span>
                </div>
                <div className="grid gap-4">
                  {inactiveProducts.map((product) => (
                    <div key={product.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                          <h4 className="text-xl font-semibold text-slate-700">{product.name}</h4>
                          {product.description && <p className="text-sm text-slate-500 mt-1">{product.description}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs rounded-full bg-slate-300 text-slate-700 px-3 py-1">已下架</span>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleActivateProduct(product.id, product.name)}
                            disabled={activatingId === product.id}
                            className="border-green-200 text-green-600 hover:border-green-400 hover:bg-green-50"
                          >
                            {activatingId === product.id ? "上架中..." : "重新上架"}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-slate-500">
                        <p>款式数量：{product.variants.length}</p>
                        <p>最近更新：{new Date(product.updatedAt ?? product.createdAt).toLocaleString()}</p>
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
    <div className="grid md:grid-cols-[1fr_auto_auto] gap-3 items-center rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
      <div>
        <p className="font-medium text-primary">{name}</p>
        <p className="text-xs text-foreground-light mt-1">{priceDisplay}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-foreground-light">当前库存：</span>
        <span className="text-base font-semibold text-primary">{inventory} 件</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={0}
          value={inventoryInput}
          onChange={(event) => setInventoryInput(Number(event.target.value))}
          className="w-24 rounded-xl border border-primary/20 px-3 py-2"
        />
        <Button type="button" variant="outline" onClick={() => onSave(inventoryInput)} disabled={!changed}>
          保存
        </Button>
      </div>
    </div>
  );
}
