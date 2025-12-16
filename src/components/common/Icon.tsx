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
  // Ensure width and height are valid SVG values
  const validWidth = typeof width === 'number' ? width : parseInt(width) || 24;
  const validHeight = typeof height === 'number' ? height : parseInt(height) || 24;
  
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