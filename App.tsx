import { Alert } from "./src/alerts";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { registerAccount } from "./src/register";
import { firebase } from "./src/firebase";
import {
  Product,
  errorMessage,
  validateProduct,
  isImageUrl,
} from "./src/model";

function Button({
  title,
  onPress,
  disabled = false,
  secondary = false,
}: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[
        s.button,
        secondary && s.secondary,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[s.buttonText, secondary && { color: "#156b58" }]}>
        {title}
      </Text>
    </Pressable>
  );
}
function Field({
  label,
  ...props
}: React.ComponentProps<typeof TextInput> & { label: string }) {
  return (
    <View style={{ gap: 7 }}>
      <Text style={s.label}>{label}</Text>
      <TextInput placeholderTextColor="#8b9792" style={s.input} {...props} />
    </View>
  );
}
function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [visible, setVisible] = useState(false);
  const lock = useRef(false);
  async function submit(reset = false) {
    if (lock.current) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      return Alert.alert("Kiểm tra email", "Vui lòng nhập email hợp lệ.");
    if (!reset && password.length < 6)
      return Alert.alert("Kiểm tra mật khẩu", "Mật khẩu cần ít nhất 6 ký tự.");
    lock.current = true;
    setBusy(true);
    try {
      if (reset) {
        await sendPasswordResetEmail(firebase!.auth, email.trim());
        Alert.alert(
          "Kiểm tra hộp thư",
          "Nếu email có tài khoản, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
        );
      } else if (register) {
        await registerAccount(email.trim(), password);
        setRegister(false);
        setPassword("");
        setVisible(false);
        Alert.alert(
          "Đăng ký thành công",
          "Hãy nhập mật khẩu để đăng nhập bằng tài khoản vừa tạo.",
        );
      } else {
        await signInWithEmailAndPassword(
          firebase!.auth,
          email.trim(),
          password,
        );
      }
    } catch (e) {
      Alert.alert("Thông báo", errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={s.auth}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.logo}>
          <Text style={{ fontSize: 35 }}>▣</Text>
        </View>
        <Text style={s.eyebrow}>SHOP / QUẢN LÝ SẢN PHẨM</Text>
        <Text style={s.hero}>
          {register ? "Tạo tài khoản" : "Xin chào bạn."}
        </Text>
        <Text style={s.muted}>Cửa hàng của bạn, gọn trong một ứng dụng.</Text>
        <View style={s.panel}>
          <Field
            label="Email"
            placeholder="ban@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            editable={!busy}
          />
          <Field
            label="Mật khẩu"
            placeholder="Ít nhất 6 ký tự"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!visible}
            autoCapitalize="none"
            editable={!busy}
          />
          <Pressable onPress={() => setVisible(!visible)}>
            <Text style={s.link}>{visible ? "Ẩn" : "Hiện"} mật khẩu</Text>
          </Pressable>
          <Button
            title={
              busy ? "Đang xử lý…" : register ? "Tạo tài khoản" : "Đăng nhập →"
            }
            disabled={busy}
            onPress={() => submit()}
          />
          <Button
            secondary
            title={
              register
                ? "Đã có tài khoản? Đăng nhập"
                : "Chưa có tài khoản? Đăng ký"
            }
            disabled={busy}
            onPress={() => setRegister(!register)}
          />
          <Pressable disabled={busy} onPress={() => submit(true)}>
            <Text style={[s.link, { textAlign: "center" }]}>
              Quên mật khẩu?
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
function Editor({
  user,
  product,
  onClose,
}: {
  user: User;
  product: Product | null;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name || "");
  const [category, setCategory] = useState(product?.category || "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [image, setImage] = useState(product?.image || "");
  const [source, setSource] = useState<"phone" | "link">(
    isImageUrl(product?.image || "") ? "link" : "phone",
  );
  const [link, setLink] = useState(
    isImageUrl(product?.image || "") ? product!.image : "",
  );
  const [imageFailed, setImageFailed] = useState(false);
  const selectedImage = source === "link" ? link.trim() : image;
  useEffect(() => setImageFailed(false), [selectedImage]);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const lock = useRef(false);
  const target = useRef(
    product
      ? doc(firebase!.db, "users", user.uid, "products", product.id)
      : doc(collection(firebase!.db, "users", user.uid, "products")),
  );
  async function choose() {
    setPicking(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Quyền truy cập ảnh",
          "Hãy cho phép truy cập thư viện ảnh trong cài đặt điện thoại.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });
      if (result.canceled) return;
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 640 } }],
        {
          compress: 0.55,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        },
      );
      const data = "data:image/jpeg;base64," + compressed.base64;
      if (data.length > 350000) {
        Alert.alert(
          "Ảnh quá lớn",
          "Vui lòng chọn ảnh đơn giản hơn hoặc cắt ảnh nhỏ hơn.",
        );
        return;
      }
      setImage(data);
    } catch {
      Alert.alert("Không chọn được ảnh", "Hãy thử chọn một ảnh khác.");
    } finally {
      setPicking(false);
    }
  }
  async function save() {
    if (lock.current) return;
    const error = validateProduct(name, category, price, selectedImage);
    if (error) return Alert.alert("Kiểm tra dữ liệu", error);
    if (imageFailed)
      return Alert.alert(
        "Không tải được ảnh",
        "Hãy kiểm tra link ảnh hoặc chọn ảnh khác.",
      );
    lock.current = true;
    setBusy(true);
    try {
      const data = {
        name: name.trim(),
        category: category.trim(),
        price: Number(price),
        image: selectedImage,
        updatedAt: serverTimestamp(),
      };
      if (product) await updateDoc(target.current, data);
      else
        await setDoc(target.current, { ...data, createdAt: serverTimestamp() });
      onClose();
    } catch (e) {
      Alert.alert("Chưa lưu được", errorMessage(e));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <Modal
      animationType="slide"
      onRequestClose={() => {
        if (!busy && !picking) onClose();
      }}
    >
      <SafeAreaView style={s.page}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={s.header}>
            <Text style={s.title}>
              {product ? "Sửa sản phẩm" : "Thêm sản phẩm"}
            </Text>
            <Button
              secondary
              title="Đóng"
              disabled={busy || picking}
              onPress={onClose}
            />
          </View>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 22, gap: 20 }}
          >
            <View style={{ flexDirection: "row", gap: 12 }}>
              <Button
                title="Từ điện thoại"
                secondary={source !== "phone"}
                disabled={busy || picking}
                onPress={() => setSource("phone")}
              />
              <Button
                title="Từ link ảnh"
                secondary={source !== "link"}
                disabled={busy || picking}
                onPress={() => setSource("link")}
              />
            </View>
            {source === "link" && (
              <>
                <Field
                  label="Link ảnh (HTTPS)"
                  placeholder="https://example.com/san-pham.jpg"
                  value={link}
                  onChangeText={setLink}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  maxLength={2048}
                  editable={!busy}
                />
                <Text style={s.muted}>
                  Dán đường dẫn trực tiếp tới ảnh công khai. Ảnh sẽ hiện bên
                  dưới để xem trước.
                </Text>
              </>
            )}
            <Pressable
              accessibilityLabel="Ảnh sản phẩm"
              disabled={busy || picking}
              onPress={source === "phone" ? choose : undefined}
              style={s.photo}
            >
              {selectedImage &&
              (source === "phone" || isImageUrl(selectedImage)) ? (
                <Image
                  key={selectedImage}
                  source={{ uri: selectedImage }}
                  onError={() => setImageFailed(true)}
                  onLoad={() => setImageFailed(false)}
                  style={{ width: "100%", height: 220, borderRadius: 18 }}
                />
              ) : (
                <Text style={s.muted}>
                  {source === "phone"
                    ? "＋ Chọn ảnh từ điện thoại"
                    : "Nhập link HTTPS để xem ảnh"}
                </Text>
              )}
            </Pressable>
            {imageFailed && (
              <Text style={s.error}>
                Không tải được ảnh. Kiểm tra link và kết nối mạng.
              </Text>
            )}
            {source === "phone" && (
              <Button
                secondary
                title={picking ? "Đang xử lý ảnh…" : "Chọn / thay ảnh"}
                disabled={busy || picking}
                onPress={choose}
              />
            )}
            <Field
              label="Tên sản phẩm"
              placeholder="Ví dụ: Áo sơ mi Oxford"
              maxLength={100}
              value={name}
              onChangeText={setName}
              editable={!busy}
            />
            <Field
              label="Loại sản phẩm"
              placeholder="Ví dụ: Thời trang nam"
              maxLength={60}
              value={category}
              onChangeText={setCategory}
              editable={!busy}
            />
            <Field
              label="Giá sản phẩm (VNĐ)"
              placeholder="Ví dụ: 250000"
              keyboardType="number-pad"
              maxLength={10}
              value={price}
              onChangeText={setPrice}
              editable={!busy}
            />
            <Text style={s.muted}>
              Nhập giá bằng số, không dùng dấu chấm hoặc dấu phẩy.
            </Text>
            <Button
              title={
                busy ? "Đang lưu…" : product ? "Lưu thay đổi" : "Thêm sản phẩm"
              }
              disabled={busy || picking}
              onPress={save}
            />
            {busy && (
              <Text style={s.muted}>
                Đang chờ Firebase xác nhận. Cần kết nối Internet.
              </Text>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
function Products({ user }: { user: User }) {
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [editor, setEditor] = useState<Product | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const deleteLock = useRef(false);
  useEffect(
    () =>
      onSnapshot(
        query(
          collection(firebase!.db, "users", user.uid, "products"),
          orderBy("createdAt", "desc"),
        ),
        (snapshot) => {
          setItems(
            snapshot.docs.map((d) => ({ ...d.data(), id: d.id }) as Product),
          );
          setLoading(false);
          setError("");
        },
        (e) => {
          setError(errorMessage(e));
          setLoading(false);
        },
      ),
    [user.uid, retry],
  );
  function remove(item: Product) {
    Alert.alert("Xóa sản phẩm?", `“${item.name}” sẽ bị xóa vĩnh viễn.`, [
      { text: "Hủy", style: "cancel" },
      {
        text: "Xóa",
        style: "destructive",
        onPress: async () => {
          if (deleteLock.current) return;
          deleteLock.current = true;
          setDeleting(item.id);
          try {
            await deleteDoc(
              doc(firebase!.db, "users", user.uid, "products", item.id),
            );
          } catch (e) {
            Alert.alert("Chưa xóa được", errorMessage(e));
          } finally {
            deleteLock.current = false;
            setDeleting(null);
          }
        },
      },
    ]);
  }
  function logout() {
    Alert.alert("Đăng xuất", "Bạn muốn đăng xuất tài khoản này?", [
      { text: "Ở lại", style: "cancel" },
      {
        text: "Đăng xuất",
        onPress: () =>
          signOut(firebase!.auth).catch((e) =>
            Alert.alert("Lỗi", errorMessage(e)),
          ),
      },
    ]);
  }
  const filtered = items.filter((p) =>
    (p.name + " " + p.category)
      .toLocaleLowerCase("vi")
      .includes(search.trim().toLocaleLowerCase("vi")),
  );
  return (
    <View style={{ flex: 1 }}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.eyebrow}>CỬA HÀNG CỦA BẠN</Text>
          <Text style={s.title}>Sản phẩm</Text>
        </View>
        <Button
          title="＋ Thêm"
          disabled={!!deleting}
          onPress={() => setEditor(null)}
        />
      </View>
      <View style={{ paddingHorizontal: 22, gap: 14, paddingBottom: 16 }}>
        <View style={s.account}>
          <Text numberOfLines={1} style={[s.muted, { flex: 1 }]}>
            {user.email}
          </Text>
          <Pressable disabled={!!deleting} onPress={logout}>
            <Text style={s.link}>Đăng xuất</Text>
          </Pressable>
        </View>
        <TextInput
          style={s.input}
          placeholder="Tìm tên hoặc loại sản phẩm…"
          value={search}
          onChangeText={setSearch}
        />
        <Text style={s.muted}>
          {filtered.length} sản phẩm • Đồng bộ Firebase
        </Text>
        {error ? (
          <View>
            <Text style={s.error}>{error}</Text>
            <Button
              secondary
              title="Thử lại"
              onPress={() => {
                setLoading(true);
                setError("");
                setRetry(retry + 1);
              }}
            />
          </View>
        ) : null}
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#156b58" />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{
            paddingHorizontal: 22,
            paddingBottom: 32,
            gap: 14,
          }}
          ListEmptyComponent={
            <View style={s.empty}>
              <Text style={{ fontSize: 40 }}>▧</Text>
              <Text style={s.title}>
                {error
                  ? "Không tải được dữ liệu"
                  : search
                    ? "Không tìm thấy sản phẩm"
                    : "Cửa hàng đang trống"}
              </Text>
              <Text style={s.muted}>
                {search
                  ? "Thử từ khóa khác."
                  : "Chạm “＋ Thêm” để tạo sản phẩm đầu tiên."}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <Image source={{ uri: item.image }} style={s.thumbnail} />
              <View style={{ flex: 1, gap: 7 }}>
                <Text style={s.tag}>{item.category}</Text>
                <Text style={s.productName}>{item.name}</Text>
                <Text style={s.price}>
                  {item.price.toLocaleString("vi-VN")} ₫
                </Text>
                <View style={{ flexDirection: "row", gap: 22, marginTop: 4 }}>
                  <Pressable
                    disabled={!!deleting}
                    onPress={() => setEditor(item)}
                  >
                    <Text style={s.link}>Sửa</Text>
                  </Pressable>
                  <Pressable disabled={!!deleting} onPress={() => remove(item)}>
                    <Text style={s.error}>
                      {deleting === item.id ? "Đang xóa…" : "Xóa"}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
        />
      )}
      {editor !== undefined && (
        <Editor
          user={user}
          product={editor}
          onClose={() => setEditor(undefined)}
        />
      )}
    </View>
  );
}
export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!firebase) {
      setReady(true);
      return;
    }
    return onAuthStateChanged(firebase.auth, (u) => {
      setUser(u);
      setReady(true);
    });
  }, []);
  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.page}>
        <StatusBar style="dark" />
        {!firebase ? (
          <View style={s.auth}>
            <Text style={s.hero}>Kết nối Firebase</Text>
            <Text style={s.muted}>
              Sao chép .env.example thành .env, điền cấu hình Firebase Web rồi
              chạy lại: npx expo start --clear
            </Text>
            <Text style={s.muted}>
              Xem README.md để bật Email/Password và xuất bản Firestore Rules.
            </Text>
          </View>
        ) : !ready ? (
          <ActivityIndicator style={{ flex: 1 }} color="#156b58" />
        ) : user ? (
          <Products key={user.uid} user={user} />
        ) : (
          <Login />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f5f7f3" },
  auth: { flexGrow: 1, justifyContent: "center", padding: 26, gap: 18 },
  logo: {
    backgroundColor: "#dcebe0",
    width: 76,
    height: 76,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#5f786c",
  },
  hero: { fontSize: 34, fontWeight: "800", color: "#163d30" },
  muted: { fontSize: 13, color: "#687b72", lineHeight: 21 },
  panel: {
    backgroundColor: "white",
    padding: 22,
    borderRadius: 24,
    gap: 18,
    marginTop: 10,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#254638" },
  input: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d9e2da",
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: "#173c30",
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: "#156b58",
    alignItems: "center",
  },
  secondary: { backgroundColor: "#e6eee7" },
  buttonText: { color: "white", fontSize: 14, fontWeight: "700" },
  link: {
    color: "#156b58",
    fontWeight: "700",
    fontSize: 13,
    paddingVertical: 3,
  },
  header: {
    padding: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontSize: 23, fontWeight: "800", color: "#173c30" },
  account: { flexDirection: "row", alignItems: "center", gap: 12 },
  card: {
    flexDirection: "row",
    gap: 16,
    backgroundColor: "white",
    padding: 15,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e8ede6",
  },
  thumbnail: {
    width: 100,
    height: 120,
    borderRadius: 13,
    backgroundColor: "#e6eee7",
  },
  tag: { fontSize: 11, color: "#657f6f" },
  productName: { fontSize: 16, fontWeight: "700", color: "#233f32" },
  price: { fontSize: 17, fontWeight: "800", color: "#156b58" },
  error: { color: "#ba3d3d", fontSize: 13, paddingVertical: 3 },
  empty: { paddingVertical: 60, alignItems: "center", gap: 16 },
  photo: {
    height: 220,
    backgroundColor: "#e6eee7",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
});


