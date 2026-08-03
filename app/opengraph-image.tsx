import { ImageResponse } from "next/og";

export const alt = "CarSalhakar";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0b0d10",
          color: "#f4f5f7",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 96,
            height: 96,
            borderRadius: 24,
            backgroundColor: "#3b82f6",
            marginBottom: 32,
            fontSize: 48,
          }}
        >
          🔧
        </div>
        <div style={{ fontSize: 64, fontWeight: 700 }}>CarSalhakar</div>
        <div style={{ fontSize: 28, color: "#9aa1ac", marginTop: 20 }}>
          Never miss a service again
        </div>
      </div>
    ),
    { ...size }
  );
}
