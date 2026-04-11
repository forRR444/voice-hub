import Link from "next/link";

export default function SalonNotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F7F8F9",
      }}
    >
      <div style={{ textAlign: "center", padding: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1A1F36", marginBottom: 8 }}>
          ページが見つかりません
        </h1>
        <p style={{ fontSize: 14, color: "#4F566B", marginBottom: 24 }}>
          このサロンページは存在しないか、非公開に設定されています。
        </p>
        <Link
          href="/"
          style={{
            display: "inline-block",
            padding: "10px 20px",
            background: "#635BFF",
            color: "#fff",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}
        >
          トップページへ
        </Link>
      </div>
    </div>
  );
}
