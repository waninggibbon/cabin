import { Nav } from './Nav'

export const UI = () => {
  return (
    <div className="fixed inset-0 z-10 pointer-events-none p-4">
      <div className="mx-auto w-full h-full max-w-[1400px] flex flex-col justify-end items-center md:justify-start md:items-end">
        <Nav />
      </div>
    </div>
  )
}
