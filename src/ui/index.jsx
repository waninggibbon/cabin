import { Nav } from "./Nav"

export const UI = () => {
    return (
         <div className="fixed inset-0 pointer-events-none flex flex-col items-center justify-center">
       <main className="w-full max-w-screen-xl px-4 mx-auto h-full flex flex-col justify-between py-8">
        <header className="flex justify-between items-center pointer-events-auto">
            <h1 className="text-2xl font-bold bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-sm">nathys cabin site</h1>
        </header>
        <Nav />
        {/* Example overlay content */}
        <section className="pointer-events-auto self-start">
            <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-lg max-w-md">
                <h2 className="text-xl font-bold mb-2">howdy bitches</h2>
                <p>this is a work in progress.</p>
            </div>
        </section>
      </main>
    </div>   
    )
}
