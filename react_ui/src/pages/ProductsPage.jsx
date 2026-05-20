// src/pages/ProductsPage.jsx
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import {
    createProduct,
    fetchProducts,
    fetchCategories,
    updateProduct,
    deleteProduct,
    importHighlandsProducts,
    resetAllProductInventory,
} from "../utils/api.js";
import { getAuth, getScopesFromToken } from "../utils/auth.js";

const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(value || 0));

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // [THÊM MỚI] State import loading
    const [importing, setImporting] = useState(false);

    const [error, setError] = useState("");
    const [actionError, setActionError] = useState("");
    const [actionSuccess, setActionSuccess] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const [editingProduct, setEditingProduct] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    const [form, setForm] = useState({
        productName: "",
        price: "",
        amount: "",
        categoryName: "",
        images: "",
    });

    const token = useMemo(() => getAuth()?.token, []);
    const scopes = useMemo(() => getScopesFromToken(token), [token]);
    const isAdmin = scopes.includes("ADMIN");

    const syncProductsByCategory = (list, categoryName = selectedCategory) => {
        const normalizedCategory = (categoryName || "all").toLowerCase();
        const filtered = normalizedCategory === "all"
            ? list
            : list.filter((p) => (p.categoryName || "").toLowerCase() === normalizedCategory);
        setProducts(filtered);
        setSelectedCategory(categoryName || "all");
    };

    const loadProducts = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await fetchProducts(token);
            const list = Array.isArray(data) ? data : [];
            setAllProducts(list);
            const uniqueCats = Array.from(new Set(list.map((i) => i.categoryName).filter(Boolean)));
            setCategories(["all", ...uniqueCats]);
            syncProductsByCategory(list, selectedCategory);
        } catch (err) {
            setError(err.message || "Không thể tải danh sách sản phẩm");
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const data = await fetchCategories(token);
            const list = Array.isArray(data) ? data : [];
            setCategories(["all", ...list]);
        } catch (err) {
            console.warn("Không thể tải danh mục:", err);
        }
    };

    useEffect(() => {
        if (token) {
            loadProducts();
            loadCategories();
        }
    }, [token]);

    // [THÊM MỚI] Hàm xử lý Import dữ liệu từ Highlands
    const handleImportHighlands = async () => {
        if (!window.confirm("Bạn có chắc muốn lấy dữ liệu menu từ Highlands Coffee? Quá trình này có thể mất vài giây.")) {
            return;
        }

        setImporting(true);
        setActionError("");
        setActionSuccess("");

        try {
            const result = await importHighlandsProducts(token);
            setActionSuccess(`Đã lấy thành công ${result ? result.length : 0} sản phẩm từ Highlands!`);
            // Tải lại dữ liệu sau khi import xong
            await loadProducts();
            await loadCategories();
        } catch (err) {
            console.error(err);
            setActionError(err.message || "Lỗi khi lấy dữ liệu từ Highlands");
        } finally {
            setImporting(false);
        }
    };

    const handleChange = (evt) => {
        const { name, value } = evt.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };
    const handleCategoryFilterChange = (value) => {
        setSelectedCategory(value);
        syncProductsByCategory(allProducts, value);
    };

    const handleResetInventory = async () => {
        if (!window.confirm("Bạn có chắc muốn đặt lại tồn kho tất cả sản phẩm về 100?")) {
            return;
        }

        setSubmitting(true);
        setActionError("");
        setActionSuccess("");

        try {
            await resetAllProductInventory(100, token);
            setActionSuccess("Đã đặt lại kho của tất cả sản phẩm về 100. Kho sẽ tự động làm mới mỗi ngày.");
            await loadProducts();
        } catch (err) {
            setActionError(err.message || "Không thể đặt lại kho");
        } finally {
            setSubmitting(false);
        }
    };
    const handleEditClick = (product) => {
        setEditingProduct(product);
        const imgStr = product.images && product.images.length > 0 ? product.images.join(",") : "";

        setForm({
            productName: product.productName,
            price: product.price,
            amount: product.amount,
            categoryName: product.categoryName || "",
            images: imgStr,
        });

        if (imgStr) {
            setImagePreview(imgStr.split(',')[0]);
        } else {
            setImagePreview(null);
        }
        setActionError("");
        setActionSuccess("");
    };

    const handleCancelEdit = () => {
        setEditingProduct(null);
        setForm({ productName: "", price: "", amount: "", categoryName: "", images: "" });
        setImagePreview(null);
        setActionError("");
        setActionSuccess("");
    };

    const handleDeleteClick = async (product) => {
        if (!window.confirm(`Bạn có chắc muốn xóa món "${product.productName}" không?`)) return;

        try {
            await deleteProduct(product.productID, token);
            alert("Đã xóa thành công!");
            loadProducts();
            if (editingProduct?.productID === product.productID) {
                handleCancelEdit();
            }
        } catch (err) {
            alert(err.message || "Xóa thất bại");
        }
    };

    const handleSubmit = async (evt) => {
        evt.preventDefault();
        setSubmitting(true);
        setActionError("");
        setActionSuccess("");

        try {
            const payload = {
                productName: form.productName.trim(),
                price: Number(form.price || 0),
                amount: form.amount === "" ? null : Number(form.amount),
                categoryName: form.categoryName.trim() || undefined,
                images: form.images
                    .split(",")
                    .map((img) => img.trim())
                    .filter(Boolean),
            };

            if (editingProduct) {
                await updateProduct(editingProduct.productID, payload, token);
                setActionSuccess("Cập nhật sản phẩm thành công");
                setEditingProduct(null);
            } else {
                await createProduct(payload, token);
                setActionSuccess("Tạo sản phẩm thành công");
            }

            setForm({ productName: "", price: "", amount: "", categoryName: "", images: "" });
            setImagePreview(null);
            await loadProducts();
            await loadCategories();
        } catch (err) {
            setActionError(err.message || "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <PageHeader
                title="Sản phẩm / Menu"
                subtitle="Quản lý danh mục & món uống"
                right={
                    <div className="d-flex gap-2">
                        {/* [THÊM MỚI] Nút Import Highlands (Chỉ Admin) */}
                        {isAdmin && (
                            <button
                                className="btn btn-warning btn-sm text-dark fw-semibold"
                                onClick={handleImportHighlands}
                                disabled={loading || importing}
                            >
                                {importing ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                        Đang lấy...
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-cloud-download me-1"></i>
                                        Lấy Menu Highlands
                                    </>
                                )}
                            </button>
                        )}
                        {isAdmin && (
                            <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={handleResetInventory}
                                disabled={loading || importing || submitting}
                            >
                                <i className="bi bi-arrow-counterclockwise me-1"></i>
                                Reset kho về 100
                            </button>
                        )}
                        <button className="btn btn-outline-secondary btn-sm" onClick={loadProducts} disabled={loading || importing}>
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Làm mới
                        </button>
                    </div>
                }
            />

            <div className="row g-3">
                <div className={isAdmin ? "col-lg-8" : "col-12"}>
                    <div className="card shadow-sm border-0 h-100">
                        <div className="card-body">
                            {error && <div className="alert alert-danger py-2 small">{error}</div>}
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3 gap-2">
                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                    <span className="fw-semibold mb-0">Lọc theo danh mục:</span>
                                    <div className="d-flex flex-wrap gap-2">
                                        {categories.map((cat) => (
                                            <button
                                                key={cat}
                                                type="button"
                                                className={`btn btn-sm ${selectedCategory === cat ? "btn-success" : "btn-light border"}`}
                                                onClick={() => handleCategoryFilterChange(cat)}
                                                disabled={loading || importing}
                                            >
                                                {cat === "all" ? "Tất cả" : cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="text-muted small fst-italic">
                                    Kho sản phẩm sẽ tự động đặt lại về 100 vào mỗi ngày.
                                </div>
                            </div>

                            {/* [THÊM MỚI] Thông báo import */}
                            {importing && (
                                <div className="alert alert-info py-2 small d-flex align-items-center">
                                    <span className="spinner-border spinner-border-sm me-2"></span>
                                    Đang kết nối tới Highlands Coffee để lấy dữ liệu, vui lòng chờ...
                                </div>
                            )}

                            {loading ? (
                                <div className="text-center text-muted py-4">Đang tải danh sách sản phẩm...</div>
                            ) : products.length === 0 ? (
                                <div className="text-center text-muted py-4">Chưa có sản phẩm trong hệ thống</div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table table-hover table-sm align-middle">
                                        <thead className="table-light">
                                            <tr>
                                                <th style={{width: '60px'}}>Ảnh</th>
                                                <th>Tên sản phẩm</th>
                                                <th>Danh mục</th>
                                                <th className="text-end">Giá bán</th>
                                                <th className="text-center">Kho</th>
                                                {isAdmin && <th className="text-end">Thao tác</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {products.map((p) => (
                                                <tr key={p.productID} className={editingProduct?.productID === p.productID ? "table-active" : ""}>
                                                    <td>
                                                        <div className="rounded border bg-light d-flex align-items-center justify-content-center"
                                                             style={{width: 40, height: 40, overflow: 'hidden'}}>
                                                            {p.images && p.images.length > 0 ? (
                                                                <img
                                                                    src={p.images[0]}
                                                                    alt=""
                                                                    className="w-100 h-100 object-fit-cover"
                                                                    onError={(e) => {e.target.onerror = null; e.target.src = "https://placehold.co/40x40?text=..."}}
                                                                />
                                                            ) : (
                                                                <i className="bi bi-cup-hot text-muted"></i>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="fw-semibold">
                                                        {p.productName}
                                                        {editingProduct?.productID === p.productID && <span className="badge bg-warning text-dark ms-2">Đang sửa</span>}
                                                    </td>
                                                    <td>
                                                        <span className="badge bg-light text-dark border">
                                                            {p.categoryName || "Chưa phân loại"}
                                                        </span>
                                                    </td>
                                                    <td className="text-end fw-bold text-success">{formatCurrency(p.price)}</td>
                                                    <td className="text-center">{p.amount ?? 0}</td>
                                                    {isAdmin && (
                                                        <td className="text-end">
                                                            <div className="btn-group btn-group-sm">
                                                                <button
                                                                    className="btn btn-outline-primary"
                                                                    onClick={() => handleEditClick(p)}
                                                                    disabled={submitting || importing}
                                                                >
                                                                    <i className="bi bi-pencil"></i>
                                                                </button>
                                                                <button
                                                                    className="btn btn-outline-danger"
                                                                    onClick={() => handleDeleteClick(p)}
                                                                    disabled={submitting || importing || editingProduct?.productID === p.productID}
                                                                >
                                                                    <i className="bi bi-trash"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {isAdmin && (
                    <div className="col-lg-4">
                        <div className={`card shadow-sm border-0 h-100 ${editingProduct ? "border-warning" : ""}`}>
                            <div className="card-body">
                                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                                    <h6 className="mb-0">
                                        {editingProduct ? `Cập nhật: ${editingProduct.productName}` : "Thêm sản phẩm mới"}
                                    </h6>
                                    {editingProduct && (
                                        <button className="btn btn-xs btn-outline-secondary" onClick={handleCancelEdit}>
                                            <i className="bi bi-x-lg"></i> Hủy
                                        </button>
                                    )}
                                </div>

                                {actionError && <div className="alert alert-danger py-2 small">{actionError}</div>}
                                {actionSuccess && <div className="alert alert-success py-2 small">{actionSuccess}</div>}

                                <form id="product-form" className="small" onSubmit={handleSubmit}>
                                    <div className="mb-2">
                                        <label className="form-label fw-semibold">Tên sản phẩm</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            name="productName"
                                            value={form.productName}
                                            onChange={handleChange}
                                            required
                                            placeholder="VD: Cà phê sữa đá"
                                        />
                                    </div>

                                    <div className="mb-2">
                                        <label className="form-label fw-semibold">Danh mục</label>
                                        <div className="input-group input-group-sm">
                                            <select
                                                className="form-select"
                                                name="categoryName"
                                                value={form.categoryName}
                                                onChange={handleChange}
                                            >
                                                <option value="">-- Chọn danh mục --</option>
                                                {categories
                                                    .filter((cat) => cat !== "all")
                                                    .map((cat, index) => (
                                                    <option key={index} value={cat}>
                                                        {cat}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="row g-2 mb-2">
                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Giá bán (VNĐ)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control form-control-sm"
                                                name="price"
                                                value={form.price}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="col-6">
                                            <label className="form-label fw-semibold">Tồn kho</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className="form-control form-control-sm"
                                                name="amount"
                                                value={form.amount}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label fw-semibold">Hình ảnh (Link Online)</label>
                                        <div className="input-group input-group-sm">
                                            <span className="input-group-text"><i className="bi bi-link-45deg"></i></span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                placeholder="Dán link ảnh vào đây..."
                                                name="images"
                                                value={form.images}
                                                onChange={(e) => {
                                                    handleChange(e);
                                                    setImagePreview(e.target.value);
                                                }}
                                            />
                                        </div>
                                        <div className="form-text text-muted small fst-italic">
                                            Bạn có thể copy link ảnh từ Facebook, Google.
                                        </div>

                                        {imagePreview ? (
                                            <div className="mt-2 text-center border rounded p-2 bg-light position-relative">
                                                <img
                                                    src={imagePreview}
                                                    alt="Preview"
                                                    style={{maxHeight: '180px', maxWidth: '100%', borderRadius: '4px', objectFit: 'contain'}}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = "https://placehold.co/400x300?text=Lỗi+Link+Ảnh";
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-danger position-absolute top-0 end-0 m-2 opacity-75"
                                                    onClick={() => {
                                                        setForm(prev => ({ ...prev, images: "" }));
                                                        setImagePreview(null);
                                                    }}
                                                    title="Xóa ảnh"
                                                >
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-2 text-center border border-dashed rounded p-4 bg-light text-muted">
                                                <i className="bi bi-card-image fs-3 d-block mb-1"></i>
                                                <small>Chưa có hình ảnh</small>
                                            </div>
                                        )}
                                    </div>

                                    <div className="d-grid gap-2">
                                        <button
                                            className={`btn btn-sm py-2 ${editingProduct ? "btn-warning" : "btn-success"}`}
                                            type="submit"
                                            disabled={submitting || importing}
                                        >
                                            {submitting ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <i className={`bi ${editingProduct ? "bi-check-circle-fill" : "bi-plus-lg"} me-1`}></i>
                                                    {editingProduct ? "Lưu thay đổi" : "Thêm sản phẩm"}
                                                </>
                                            )}
                                        </button>

                                        {editingProduct && (
                                            <button
                                                type="button"
                                                className="btn btn-outline-secondary btn-sm"
                                                onClick={handleCancelEdit}
                                                disabled={submitting || importing}
                                            >
                                                Hủy bỏ
                                            </button>
                                        )}
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
