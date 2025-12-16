interface IconProps {
  width?: number | string;
  height?: number | string;
  className?: string;
  color?: string;
}

export const Icon = ({
  width = 24,
  height = 24,
  className = "",
  color = "currentColor",
  ...props
}: IconProps) => {
  // Ensure width and height are valid SVG values (numeric only)
  const normalizeSize = (value: number | string): number => {
    if (typeof value === 'number') return value
    if (typeof value === 'string') {
      // Handle common size values
      const sizeMap: Record<string, number> = {
        'xs': 12, 'sm': 16, 'md': 24, 'lg': 32, 'xl': 48, '2xl': 64
      }
      if (sizeMap[value]) return sizeMap[value]
      const parsed = parseInt(value, 10)
      return isNaN(parsed) ? 24 : parsed
    }
    return 24
  }
  
  const validWidth = normalizeSize(width)
  const validHeight = normalizeSize(height)
  
  return (
    <svg
      width={validWidth}
      height={validHeight}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
};