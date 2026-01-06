export const Button = ({
  children,
  onClick,
  className,
  variant = 'default'
}) => {
  const isAttention = variant === 'attention';
  const borderColor = isAttention ? 'border-pumkin-500' : 'border-fog';
  const textColor = isAttention ? 'text-pumkin-500' : 'text-fog';

  return (
    <button
      onClick={onClick}
      className={`group relative box-border flex h-20 w-20 cursor-pointer items-center justify-center rounded-3xl border-4 ${borderColor} bg-pine transition-all duration-500 hover:scale-[1.15] ${className || ''}`}
    >
      <div
        className={`group-hover:animate-wiggle transition-colors duration-500 [&>svg]:h-10 [&>svg]:w-10 ${textColor}`}
      >
        {children}
      </div>
    </button>
  );
};
