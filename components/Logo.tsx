export default function Logo({ size = 36, dark = false }: { size?: number; dark?: boolean }) {
  const amcColor = dark ? "#ffffff" : "#0d1b2a";
  const careColor = dark ? "#90caf9" : "#1565c0";

  return (
    <svg
      width={size * 2.5}
      height={size}
      viewBox="0 0 100 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="AMC Care"
    >
      <text
        x="0"
        y="27"
        fontFamily="'Arial', sans-serif"
        fontWeight="800"
        fontSize="20"
        fill={amcColor}
        letterSpacing="-0.5"
      >
        AMC
      </text>
      <text
        x="48"
        y="27"
        fontFamily="'Arial', sans-serif"
        fontWeight="400"
        fontSize="20"
        fill={careColor}
        letterSpacing="0"
      >
        care
      </text>
    </svg>
  );
}
