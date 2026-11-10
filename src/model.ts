export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  createdAt?: any;
  updatedAt?: any;
};
export function isImageUrl(value: string) {
  if (value.length > 2048 || !value.startsWith("https://") || /\s/.test(value))
    return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      !!url.hostname &&
      !url.username &&
      !url.password
    );
  } catch {
    return false;
  }
}
export function validateProduct(
  name: string,
  category: string,
  price: string,
  image: string,
) {
  if (!name.trim() || name.trim().length > 100)
    return "Tên sản phẩm phải có từ 1 đến 100 ký tự.";
  if (!category.trim() || category.trim().length > 60)
    return "Loại sản phẩm phải có từ 1 đến 60 ký tự.";
  if (
    !/^\d+$/.test(price) ||
    !Number.isSafeInteger(Number(price)) ||
    Number(price) <= 0 ||
    Number(price) > 1000000000
  )
    return "Giá phải là số nguyên từ 1 đến 1.000.000.000 đồng (không nhập dấu phân cách).";
  if (
    !isImageUrl(image) &&
    (!image.startsWith("data:image/jpeg;base64,") || image.length > 350000)
  )
    return "Vui lòng chọn ảnh từ điện thoại hoặc nhập link HTTPS hợp lệ (tối đa 2048 ký tự).";
  return null;
}
export function errorMessage(error: unknown) {
  const code = (error as { code?: string })?.code || "";
  const messages: Record<string, string> = {
    "auth/invalid-credential": "Email hoặc mật khẩu không đúng.",
    "auth/invalid-email": "Email không hợp lệ.",
    "auth/email-already-in-use": "Email này đã được đăng ký.",
    "auth/weak-password": "Mật khẩu cần ít nhất 6 ký tự.",
    "auth/password-does-not-meet-requirements":
      "Mật khẩu chưa đạt chính sách của dự án Firebase.",
    "auth/network-request-failed": "Không kết nối được mạng. Vui lòng thử lại.",
    "auth/too-many-requests": "Có quá nhiều yêu cầu. Hãy thử lại sau.",
    "auth/operation-not-allowed":
      "Hãy bật Email/Password trong Firebase Authentication.",
    "permission-denied":
      "Không có quyền truy cập. Kiểm tra Firestore Rules trong README.",
    unavailable: "Không kết nối được Firebase. Kiểm tra Internet.",
    "auth/user-disabled": "Tài khoản đã bị vô hiệu hóa.",
  };
  return (
    messages[code] ||
    `Không thể thực hiện thao tác. Vui lòng thử lại${code ? " (" + code + ")" : ""}.`
  );
}
