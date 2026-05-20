// src/pages/LoginPage.jsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authenticate, fetchUserById } from "../utils/api.js";
import { saveAuth, isAuthenticated } from "../utils/auth.js";
import LoginBackground from "../assets/Login_background.png";


export default function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isAuthenticated()) {
            navigate("/dashboard", { replace: true });
        }
    }, [navigate]);

    const handleChange = (e) =>
        setForm({ ...form, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const trimmedUsername = form.username.trim();
            const authData = await authenticate({
                username: trimmedUsername,
                password: form.password,
            });

            if (!authData?.token) {
                throw new Error("Không nhận được token từ máy chủ");
            }

            let profile = null;

            try {
                profile = await fetchUserById(trimmedUsername, authData.token);
            } catch (profileErr) {
                console.warn("Không lấy được thông tin người dùng", profileErr);
            }

            const roleLabel =
                (Array.isArray(profile?.roles) && profile.roles.length
                    ? profile.roles.join(", ")
                    : profile?.role) || (authData.authenticated ? "Đã xác thực" : "Người dùng");

            saveAuth({
                token: authData.token,
                user: {
                    username: profile?.username || trimmedUsername,
                    fullname: profile?.fullname || trimmedUsername,
                    roles: profile?.roles,
                    role: roleLabel,
                },
            });

            const next = location.state?.from || "/dashboard";
            navigate(next, { replace: true });
        } catch (err) {
            setError(err.message || "Đăng nhập thất bại, vui lòng thử lại");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="d-flex align-items-center justify-content-center"
            style={{ minHeight: "100vh", backgroundColor: "#f3faf7" }}
        >
            <div className="row w-100" style={{ maxWidth: 900 }}>
                {/* Hình minh họa bên trái */}
                <div className="col-md-6 d-none d-md-flex flex-column justify-content-center">

                    <img src={LoginBackground} alt="background" className="img-fluid" />
                </div>

                {/* Form login bên phải */}
                <div className="col-md-6">
                    <div className="card shadow-sm border-0">
                        <div className="card-body p-4">
                            <div className="mb-4 text-center">
                                <div
                                    className="rounded-circle mx-auto mb-2 d-flex align-items-center justify-content-center"
                                    style={{
                                        width: 56,
                                        height: 56,
                                        backgroundColor: "#03a66a",
                                        color: "#fff",
                                        fontWeight: "bold",
                                        fontSize: 24,
                                    }}
                                >
                                    CF
                                </div>
                                <h4 className="mb-1">Đăng nhập</h4>
                                <small className="text-muted">
                                    Nhập tài khoản để truy cập hệ thống
                                </small>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Tài khoản</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        name="username"
                                        value={form.username}
                                        onChange={handleChange}
                                        placeholder="admin"
                                        autoComplete="username"
                                        disabled={isSubmitting}
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Mật khẩu</label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        name="password"
                                        value={form.password}
                                        onChange={handleChange}
                                        placeholder="•••••••"
                                        autoComplete="current-password"
                                        disabled={isSubmitting}
                                    />
                                </div>

                                {error && (
                                    <div className="alert alert-danger py-2 small" role="alert">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn btn-success w-100"
                                    style={{ backgroundColor: "#03a66a", borderColor: "#03a66a" }}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
                                </button>
                                {/*<p className="text-muted small text-center mt-3 mb-0">*/}
                                {/*    Gợi ý: dùng tài khoản <strong>admin</strong> để nhận vai trò quản trị*/}
                                {/*</p>*/}
                            </form>
                        </div>
                    </div>

                    <p className="text-center text-muted small mt-3">
                        © {new Date().getFullYear()} Café Manager
                    </p>
                </div>
            </div>
        </div>
    );
}
