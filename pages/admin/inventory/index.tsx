import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { FaBoxes, FaPlus, FaTrash } from "react-icons/fa";

interface Store {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
  quantity: number;
  status: string;
}

interface InventoryItem {
  _id: string;
  storeId: string;
  productId: {
    _id: string;
    name: string;
    sku: string;
  };
  type: "IN" | "OUT" | "ADJUSTMENT";
  quantity: number;
  quantityBefore: number;
  quantityAfter: number;
  note: string;
  reference: string;
  createdBy: {
    _id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface InventoryResponse {
  inventory: InventoryItem[];
  pagination: Pagination;
}

interface ProductsResponse {
  products: Product[];
}

export default function InventoryPage() {
  const { data: session, status } = useSession();

  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [type, setType] = useState("");

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [quantity, setQuantity] = useState("");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");

  const [loadingStores, setLoadingStores] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSuperAdmin = session?.user?.role === "SUPER_ADMIN";

  /*
   * Load stores for SUPER_ADMIN
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!isSuperAdmin) return;

    const loadStores = async () => {
      try {
        setLoadingStores(true);
        setError("");

        const response = await fetch("/api/admin/stores");

        if (!response.ok) {
          throw new Error("Failed to load stores.");
        }

        const data = await response.json();

        const storeList: Store[] = data.stores || [];

        setStores(storeList);

        if (storeList.length > 0) {
          setSelectedStore((current) => current || storeList[0]._id);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load stores.",
        );
      } finally {
        setLoadingStores(false);
      }
    };

    loadStores();
  }, [status, isSuperAdmin]);

  /*
   * Determine current store
   */
  useEffect(() => {
    if (status !== "authenticated") return;

    if (!isSuperAdmin && session?.user?.storeId) {
      setSelectedStore(session.user.storeId);
    }
  }, [status, isSuperAdmin, session?.user?.storeId]);

  /*
   * Load products when store changes
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!selectedStore) return;

    const loadProducts = async () => {
      try {
        setLoadingProducts(true);
        setError("");

        const params = new URLSearchParams({
          storeId: selectedStore,
          page: "1",
          limit: "100",
        });

        const response = await fetch(
          `/api/admin/products?${params.toString()}`,
        );

        if (!response.ok) {
          throw new Error("Failed to load products.");
        }

        const data: ProductsResponse = await response.json();

        setProducts(data.products || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load products.",
        );
      } finally {
        setLoadingProducts(false);
      }
    };

    setSelectedProduct("");
    setPage(1);

    loadProducts();
  }, [status, selectedStore]);

  /*
   * Load inventory
   */
  useEffect(() => {
    if (status !== "authenticated") return;
    if (!selectedStore) return;

    const loadInventory = async () => {
      try {
        setLoadingInventory(true);
        setError("");

        const params = new URLSearchParams({
          storeId: selectedStore,
          page: String(page),
          limit: "20",
        });

        if (selectedProduct) {
          params.set("productId", selectedProduct);
        }

        if (type) {
          params.set("type", type);
        }

        const response = await fetch(
          `/api/admin/inventory?${params.toString()}`,
        );

        if (!response.ok) {
          const data = await response.json().catch(() => null);

          throw new Error(
            data?.message || "Failed to load inventory.",
          );
        }

        const data: InventoryResponse = await response.json();

        setInventory(data.inventory || []);

        setPagination(
          data.pagination || {
            page,
            limit: 20,
            total: 0,
            totalPages: 1,
          },
        );
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load inventory.",
        );
      } finally {
        setLoadingInventory(false);
      }
    };

    loadInventory();
  }, [status, selectedStore, selectedProduct, type, page]);

  /*
   * Create inventory adjustment
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedStore) {
      setError("Please select a store.");
      return;
    }

    if (!selectedProduct) {
      setError("Please select a product.");
      return;
    }

    const parsedQuantity = Number(quantity);

    if (!Number.isInteger(parsedQuantity) || parsedQuantity === 0) {
      setError("Quantity must be a non-zero integer.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storeId: selectedStore,
          productId: selectedProduct,
          quantity: parsedQuantity,
          note: note.trim(),
          reference: reference.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to update inventory.",
        );
      }

      setSuccess("Inventory updated successfully.");

      setQuantity("");
      setNote("");
      setReference("");

      setPage(1);

      /*
       * Reload inventory immediately
       */
      const params = new URLSearchParams({
        storeId: selectedStore,
        page: "1",
        limit: "20",
      });

      if (selectedProduct) {
        params.set("productId", selectedProduct);
      }

      if (type) {
        params.set("type", type);
      }

      const inventoryResponse = await fetch(
        `/api/admin/inventory?${params.toString()}`,
      );

      if (inventoryResponse.ok) {
        const inventoryData: InventoryResponse =
          await inventoryResponse.json();

        setInventory(inventoryData.inventory || []);

        setPagination(
          inventoryData.pagination || {
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
          },
        );
      }

      /*
       * Reload products to update current stock quantity
       */
      const productParams = new URLSearchParams({
        storeId: selectedStore,
        page: "1",
        limit: "100",
      });

      const productsResponse = await fetch(
        `/api/admin/products?${productParams.toString()}`,
      );

      if (productsResponse.ok) {
        const productsData: ProductsResponse =
          await productsResponse.json();

        setProducts(productsData.products || []);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update inventory.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleResetFilters = () => {
    setSelectedProduct("");
    setType("");
    setPage(1);
  };

  
  if (status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  /*
   * No authenticated session
   */
  if (!session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
        Please sign in.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-900 text-white">
              <FaBoxes />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Inventory
              </h1>

              <p className="text-sm text-gray-500">
                Manage product stock and inventory movements.
              </p>
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="w-full lg:w-72">
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Store
            </label>

            <select
              value={selectedStore}
              onChange={(event) => {
                setSelectedStore(event.target.value);
                setPage(1);
              }}
              disabled={loadingStores}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            >
              <option value="">
                {loadingStores ? "Loading stores..." : "Select store"}
              </option>

              {stores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      {/* Add inventory */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <FaPlus className="text-gray-700" />

          <h2 className="text-lg font-semibold text-gray-900">
            Adjust Inventory
          </h2>
        </div>

        <form
          onSubmit={handleSubmit}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Product */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product
            </label>

            <select
              value={selectedProduct}
              onChange={(event) =>
                setSelectedProduct(event.target.value)
              }
              disabled={!selectedStore || loadingProducts}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            >
              <option value="">
                {loadingProducts
                  ? "Loading products..."
                  : "Select product"}
              </option>

              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} — {product.sku} — Stock:{" "}
                  {product.quantity}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Quantity
            </label>

            <input
              type="number"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              placeholder="Example: 10 or -5"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            />

            <p className="mt-1 text-xs text-gray-400">
              Positive = stock in, negative = adjustment out.
            </p>
          </div>

          {/* Reference */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Reference
            </label>

            <input
              type="text"
              value={reference}
              onChange={(event) =>
                setReference(event.target.value)
              }
              placeholder="PO-001 / adjustment..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            />
          </div>

          {/* Note */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Note
            </label>

            <input
              type="text"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Inventory note..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            />
          </div>

          {/* Submit */}
          <div className="md:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={
                saving ||
                !selectedStore ||
                !selectedProduct ||
                !quantity
              }
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FaPlus />

              {saving ? "Updating..." : "Update Inventory"}
            </button>
          </div>
        </form>
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Inventory History
            </h2>

            <p className="text-sm text-gray-500">
              Track all stock movements.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <FaTrash />

            Reset
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Product filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Product
            </label>

            <select
              value={selectedProduct}
              onChange={(event) => {
                setSelectedProduct(event.target.value);
                setPage(1);
              }}
              disabled={!selectedStore || loadingProducts}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            >
              <option value="">All products</option>

              {products.map((product) => (
                <option key={product._id} value={product._id}>
                  {product.name} — {product.sku}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Type
            </label>

            <select
              value={type}
              onChange={(event) => {
                setType(event.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-gray-900"
            >
              <option value="">All types</option>
              <option value="IN">IN</option>
              <option value="OUT">OUT</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
          </div>
        </div>
      </div>

      {/* Inventory table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Product
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Type
                </th>

                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Quantity
                </th>

                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  Before
                </th>

                <th className="px-4 py-3 text-right font-semibold text-gray-700">
                  After
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Reference
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Created By
                </th>

                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Date
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {loadingInventory ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    Loading inventory...
                  </td>
                </tr>
              ) : inventory.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-500"
                  >
                    No inventory records found.
                  </td>
                </tr>
              ) : (
                inventory.map((item) => (
                  <tr
                    key={item._id}
                    className="transition hover:bg-gray-50"
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">
                        {item.productId?.name || "Unknown product"}
                      </div>

                      <div className="mt-1 text-xs text-gray-500">
                        {item.productId?.sku || "-"}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      {item.type === "IN" && (
                        <span className="inline-flex rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          IN
                        </span>
                      )}

                      {item.type === "OUT" && (
                        <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                          OUT
                        </span>
                      )}

                      {item.type === "ADJUSTMENT" && (
                        <span className="inline-flex rounded-full bg-yellow-100 px-2.5 py-1 text-xs font-medium text-yellow-700">
                          ADJUSTMENT
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      {item.quantity > 0 ? "+" : ""}
                      {item.quantity}
                    </td>

                    <td className="px-4 py-4 text-right text-gray-600">
                      {item.quantityBefore}
                    </td>

                    <td className="px-4 py-4 text-right font-semibold text-gray-900">
                      {item.quantityAfter}
                    </td>

                    <td className="px-4 py-4">
                      <div className="text-gray-900">
                        {item.reference || "-"}
                      </div>

                      {item.note && (
                        <div className="mt-1 max-w-xs truncate text-xs text-gray-500">
                          {item.note}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4">
                      {item.createdBy ? (
                        <>
                          <div className="font-medium text-gray-900">
                            {item.createdBy.name}
                          </div>

                          <div className="text-xs text-gray-500">
                            {item.createdBy.email}
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400">
                          System
                        </span>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-gray-600">
                      {new Date(item.createdAt).toLocaleString(
                        "vi-VN",
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
              {" · "}
              {pagination.total} records
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1 || loadingInventory}
                onClick={() =>
                  setPage((current) => Math.max(1, current - 1))
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>

              <button
                type="button"
                disabled={
                  page >= pagination.totalPages ||
                  loadingInventory
                }
                onClick={() =>
                  setPage((current) =>
                    Math.min(
                      pagination.totalPages,
                      current + 1,
                    ),
                  )
                }
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

InventoryPage.Layout = "Admin";