import logo from "../../src/assets/Logo.png";

export function AppLogo({ variant = "full", size = 36, className = "", style = {} }) {
  return (
    <div
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        ...style,
      }}
    >
      <img
        src={logo}
        alt="DPP logo"
        style={{
          width: size,
          border: "none",
          objectFit: "contain",
          display: "block",
        }}
      />
    </div>
  );
}
