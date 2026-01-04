export const Button = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group relative box-border flex h-20 w-20 cursor-pointer items-center justify-center rounded-3xl border-4 border-sorc-500 bg-halfling-100 transition-transform duration-500 hover:scale-[1.15]"
    >
      <div className="group-hover:animate-wiggle [&>svg]:h-10 [&>svg]:w-10 text-sorc-500">
        {children}
      </div>
    </button>
  )
}
